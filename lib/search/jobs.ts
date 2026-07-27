import type { JobResult } from "@/lib/search/types";
import type { SmartJobFilters } from "@/lib/search/smart-query";
import { relatedCategoryFromTerms } from "@/lib/search/categories";
import { inferJobFacets } from "@/lib/search/job-facets";
import { bilingualSearchTerms } from "@/lib/search/ka-latin";

const DEFAULT_PAGE_SIZE = 20;
const DESCRIPTION_MAX_CHARS = 220;
/** Fixed upstream pool for keyword search — same size on every page. */
const RELEVANCE_POOL_MAX = 400;
/** Cap parallel upstream term fetches (primary + strongest alts). */
const MAX_FETCH_TERMS = 4;

/** Hard ranking tiers — title always before description before category fill. */
const TIER_TITLE = 1;
const TIER_DESCRIPTION = 2;
const TIER_CATEGORY = 3;

type ScrapedJobRow = {
  id: string;
  source: string;
  source_host: string;
  title: string | null;
  company: string | null;
  business_name: string | null;
  description_html: string | null;
  salary_text: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  city: string | null;
  address: string | null;
  company_logo_url: string | null;
  source_url: string | null;
  apply_url?: string | null;
  category_id?: number | null;
  /** Source-site application deadline (ISO). Never invent this client-side. */
  expires_at?: string | null;
  scraped_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const KA_MONTHS_SHORT = [
  "იან",
  "თებ",
  "მარ",
  "აპრ",
  "მაი",
  "ივნ",
  "ივლ",
  "აგვ",
  "სექ",
  "ოქტ",
  "ნოე",
  "დეკ",
];

export type SearchJobsPage = {
  results: JobResult[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
};

function getSamushaoApiBaseUrl() {
  return (
    process.env.SAMUSHAO_API_BASE ||
    process.env.NEXT_PUBLIC_SAMUSHAO_API_BASE ||
    "https://samushao.ge"
  ).replace(/\/$/, "");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    });
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  const text = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<\s*li(\s[^>]*)?>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(text).replace(/\s+/g, " ").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const sliced = text.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.trimEnd()}…`;
}

/** Prefer a snippet that shows where the query matched. */
function snippetForTerms(text: string, terms: string[], max: number): string {
  if (!text) return "";
  if (!terms.length) return truncate(text, max);

  const lower = text.toLowerCase();
  let bestIdx = -1;
  let bestTermLen = 0;
  for (const term of terms) {
    const t = term.toLowerCase();
    if (!t) continue;
    const idx = lower.indexOf(t);
    if (idx < 0) continue;
    if (bestIdx < 0 || idx < bestIdx) {
      bestIdx = idx;
      bestTermLen = t.length;
    }
  }

  if (bestIdx < 0) return truncate(text, max);

  const pad = Math.floor((max - bestTermLen) / 2);
  let start = Math.max(0, bestIdx - pad);
  let end = Math.min(text.length, start + max);
  if (end - start < max) start = Math.max(0, end - max);

  // Snap to word boundaries when possible
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space > start && space - start < 24) start = space + 1;
  }

  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < text.length) snippet = `${snippet}…`;
  return snippet;
}

function formatSalaryInt(n: number): string {
  const abs = String(Math.trunc(Math.abs(n)));
  const expanded = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return n < 0 ? `-${expanded}` : expanded;
}

function formatSalary(row: ScrapedJobRow): string {
  const min = Math.round(Number(row.salary_min) || 0);
  const max = Math.round(Number(row.salary_max) || 0);
  const rawCurrency = (row.salary_currency || "").trim();
  const currency =
    !rawCurrency ||
    rawCurrency.toUpperCase() === "GEL" ||
    rawCurrency.toUpperCase() === "GEL."
      ? "₾"
      : rawCurrency;

  if (min > 0 && max > 0 && min !== max) {
    return `${formatSalaryInt(min)} – ${formatSalaryInt(max)} ${currency}`;
  }
  if (min > 0 || max > 0) {
    return `${formatSalaryInt(max || min)} ${currency}`;
  }

  const text = (row.salary_text || "").trim();
  if (text) return text;
  return "შეთანხმებით";
}

/** Start of "today" in Georgia (Asia/Tbilisi, UTC+4), as epoch ms. */
export function startOfTodayTbilisiMs(now = new Date()): number {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tbilisi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return Date.parse(`${day}T00:00:00+04:00`);
}

function rowUploadedToday(row: ScrapedJobRow, sinceMs: number): boolean {
  const ms = scrapedAtMs(row);
  return ms > 0 && ms >= sinceMs;
}

/** Strict salary gate — "2000+" means floor >= 2000, not merely max >= 2000. */
function rowMatchesSalaryFilters(
  row: ScrapedJobRow,
  filters: SmartJobFilters,
): boolean {
  const min = Math.round(Number(row.salary_min) || 0);
  const max = Math.round(Number(row.salary_max) || 0);
  const hasNumeric = min > 0 || max > 0;

  if (filters.hasSalary || filters.salaryMin != null || filters.salaryMax != null) {
    if (!hasNumeric) return false;
  }

  if (filters.salaryMin != null) {
    const floor = min > 0 ? min : max;
    if (floor < filters.salaryMin) return false;
  }

  if (filters.salaryMax != null) {
    const ceil = max > 0 ? max : min;
    if (ceil > filters.salaryMax) return false;
  }

  return true;
}

function rowMatchesPostFilters(
  row: ScrapedJobRow,
  filters: SmartJobFilters,
  todaySinceMs?: number,
): boolean {
  if (!rowMatchesSalaryFilters(row, filters)) return false;
  if (filters.uploadedSince === "today") {
    const since = todaySinceMs ?? startOfTodayTbilisiMs();
    if (!rowUploadedToday(row, since)) return false;
  }
  return true;
}

function formatKaDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tbilisi",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);
  const day = Number(parts.find((p) => p.type === "day")?.value || 0);
  const monthIdx =
    Number(parts.find((p) => p.type === "month")?.value || 1) - 1;
  const year = Number(parts.find((p) => p.type === "year")?.value || 0);
  const month = KA_MONTHS_SHORT[monthIdx] ?? "";
  return `${day} ${month}. ${year}`;
}

function resolveUploadDate(row: ScrapedJobRow): Date | null {
  const raw = row.scraped_at || row.created_at || row.updated_at;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatUploadedAt(row: ScrapedJobRow): string {
  const date = resolveUploadDate(row);
  return date ? formatKaDate(date) : "";
}

function resolveExpiresDate(row: ScrapedJobRow): Date | null {
  const raw = row.expires_at;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Real source deadline only — never invent upload+30. */
function formatExpiresAt(row: ScrapedJobRow): string {
  const date = resolveExpiresDate(row);
  return date ? formatKaDate(date) : "";
}

function formatCity(row: ScrapedJobRow): string {
  const city = (row.city || "").trim();
  if (city && !/^უცნობი$/i.test(city) && !/^unknown$/i.test(city)) {
    return city;
  }
  const address = (row.address || "").trim();
  if (address) {
    const fromAddress = address.split(",")[0]?.trim() || address;
    if (fromAddress && !/^უცნობი$/i.test(fromAddress)) return fromAddress;
  }
  return "თბილისი";
}

function mapScrapedJob(row: ScrapedJobRow, terms: string[] = []): JobResult {
  const plain = stripHtml(row.description_html);
  return {
    id: row.id,
    title: (row.title || "ვაკანსია").trim(),
    company: (row.company || row.business_name || "კომპანია").trim(),
    city: formatCity(row),
    description: snippetForTerms(plain, terms, DESCRIPTION_MAX_CHARS),
    logoUrl: (row.company_logo_url || "").trim(),
    sourceName: (row.source_host || row.source || "").trim(),
    url: (row.source_url || row.apply_url || "").trim(),
    salary: formatSalary(row),
    uploadedAt: formatUploadedAt(row),
    expiresAt: formatExpiresAt(row),
  };
}

function queryTerms(filters: SmartJobFilters): string[] {
  const primary = (filters.q || "").trim();
  const alts = (filters.qAlternates || [])
    .map((s) => s.trim())
    .filter(Boolean);
  const terms = [primary, ...alts].filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const term of terms) {
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(term);
  }
  return unique;
}

function fieldContainsTerm(field: string, term: string): boolean {
  if (!field || !term) return false;
  const f = field.toLowerCase();
  const t = term.toLowerCase();
  // Short stubs (das→დას): whole token only — never a prefix inside
  // დასუფთავება / random description noise.
  if ([...t].length <= 3) {
    const tokens = f.split(/[^\p{L}\p{N}.+#/-]+/u).filter(Boolean);
    return tokens.some((tok) => tok === t);
  }
  return f.includes(t);
}

type RankContext = {
  terms: string[];
  primary: string;
  relatedCategoryId?: number;
  /** Employer/brand search — match company (or title), never sector fill */
  companySearch?: boolean;
};

function rowCompanyText(row: ScrapedJobRow): string {
  return `${row.company || ""} ${row.business_name || ""}`.toLowerCase();
}

/**
 * 1 = title / company contains keyword
 * 2 = description contains keyword (no title/company hit)
 * 3 = related category fill (no keyword in title/description)
 * 0 = drop
 */
function matchTier(row: ScrapedJobRow, ctx: RankContext): number {
  if (!ctx.terms.length) return TIER_CATEGORY;
  const title = (row.title || "").toLowerCase();
  const company = rowCompanyText(row);
  const desc = stripHtml(row.description_html).toLowerCase();

  for (const term of ctx.terms) {
    const t = term.toLowerCase();
    if (!t) continue;
    if (fieldContainsTerm(company, t) || fieldContainsTerm(title, t)) {
      return TIER_TITLE;
    }
  }

  // Company queries: do not fall through to description / IT category fill.
  if (ctx.companySearch) return 0;

  for (const term of ctx.terms) {
    const t = term.toLowerCase();
    if (t && fieldContainsTerm(desc, t)) return TIER_DESCRIPTION;
  }
  if (
    ctx.relatedCategoryId != null &&
    Number(row.category_id) === ctx.relatedCategoryId
  ) {
    return TIER_CATEGORY;
  }
  return 0;
}

/** Within a tier: prefer company name hits, then title, then recency. */
function withinTierScore(row: ScrapedJobRow, ctx: RankContext): number {
  const title = (row.title || "").toLowerCase();
  const company = rowCompanyText(row);
  const primary = ctx.primary.toLowerCase();
  let score = 0;
  if (primary && fieldContainsTerm(company, primary)) {
    score += 200;
    if (company.trim() === primary) score += 80;
  }
  if (primary && fieldContainsTerm(title, primary)) {
    score += 100;
    if (title === primary) score += 50;
    else if (title.startsWith(primary)) score += 25;
  }
  for (const term of ctx.terms) {
    const t = term.toLowerCase();
    if (!t || t === primary) continue;
    if (fieldContainsTerm(company, t)) score += 40;
    if (fieldContainsTerm(title, t)) score += 10;
  }
  return score;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scrapedAtMs(row: ScrapedJobRow): number {
  const date = resolveUploadDate(row);
  return date ? date.getTime() : 0;
}

async function fetchScrapedRows(
  filters: SmartJobFilters,
  q: string,
  options: {
    limit: number;
    offset: number;
    qFields?: string;
    /** Override filters.categoryId; pass null to force no category filter. */
    categoryId?: number | null;
  },
): Promise<{ rows: ScrapedJobRow[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams({
    limit: String(options.limit),
    offset: String(options.offset),
    order: "newest",
  });

  if (q) {
    params.set("q", q);
    params.set("q_fields", options.qFields || "title,description,company");
  }
  const categoryId =
    options.categoryId !== undefined ? options.categoryId : filters.categoryId;
  if (categoryId != null) {
    params.set("category_id", String(categoryId));
  }
  if (filters.city) params.set("city", filters.city);
  if (filters.salaryMin != null) {
    params.set("salary_min", String(filters.salaryMin));
  }
  if (filters.salaryMax != null) {
    params.set("salary_max", String(filters.salaryMax));
  }
  if (filters.hasSalary) params.set("has_salary", "1");
  if (filters.workingMode) {
    params.set("working_mode", filters.workingMode);
  }
  if (filters.experience?.length) {
    params.set("experience", filters.experience.join(","));
  }
  if (filters.employmentType) {
    params.set("employment_type", filters.employmentType);
  }
  if (filters.uploadedSince === "today") {
    params.set(
      "scraped_after",
      new Date(startOfTodayTbilisiMs()).toISOString(),
    );
  }

  const res = await fetch(
    `${getSamushaoApiBaseUrl()}/api/scraped-jobs?${params}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    throw new Error(`scraped-jobs failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    jobs?: ScrapedJobRow[];
    total?: number;
    has_more?: boolean;
    offset?: number;
    limit?: number;
  };

  const rows = data.jobs || [];
  const total = Number(data.total) || rows.length;
  const hasMore =
    typeof data.has_more === "boolean"
      ? data.has_more
      : options.offset + rows.length < total;

  return { rows, total, hasMore };
}

function rankByTiers(rows: ScrapedJobRow[], ctx: RankContext): ScrapedJobRow[] {
  return [...rows].sort((a, b) => {
    const tierA = matchTier(a, ctx);
    const tierB = matchTier(b, ctx);
    if (tierA !== tierB) {
      // Lower tier number = higher priority; 0 (drop) sorts last.
      if (tierA === 0) return 1;
      if (tierB === 0) return -1;
      return tierA - tierB;
    }
    const scoreDiff = withinTierScore(b, ctx) - withinTierScore(a, ctx);
    if (scoreDiff !== 0) return scoreDiff;
    return scrapedAtMs(b) - scrapedAtMs(a);
  });
}

/**
 * Search each role branch on its own, then interleave: A1, B1, A2, B2, …
 * so "ბუღალტერი მოლარე" doesn't bury one role under the other.
 */
async function searchJobsRoundRobin(
  filters: SmartJobFilters,
  options: { limit: number; offset: number },
): Promise<SearchJobsPage> {
  const branches = (filters.qBranches || [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (branches.length < 2) {
    return searchJobs({ ...filters, qBranches: undefined }, options);
  }

  const { limit, offset } = options;
  // Same fixed window per branch on every page so totals don't grow while paging.
  const perBranch = RELEVANCE_POOL_MAX;

  const branchPages = await Promise.all(
    branches.map((branch) => {
      const bi = bilingualSearchTerms(branch);
      return searchJobs(
        {
          ...filters,
          q: bi.q || branch,
          qAlternates: bi.qAlternates.length
            ? bi.qAlternates.slice(0, 3)
            : undefined,
          qBranches: undefined,
          categoryId: undefined,
          categoryName: undefined,
          relatedCategoryId: undefined,
          relatedCategoryName: undefined,
        },
        { limit: perBranch, offset: 0 },
      );
    }),
  );

  const queues = branchPages.map((page) => [...page.results]);
  const interleaved: JobResult[] = [];
  const seen = new Set<string>();
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const queue of queues) {
      while (queue.length > 0) {
        const job = queue.shift()!;
        if (seen.has(job.id)) continue;
        seen.add(job.id);
        interleaved.push(job);
        progressed = true;
        break;
      }
    }
  }

  const slice = interleaved.slice(offset, offset + limit);
  const hasMore = offset + slice.length < interleaved.length;

  return {
    results: slice,
    total: interleaved.length,
    limit,
    offset,
    hasMore,
    nextOffset: hasMore ? offset + slice.length : null,
  };
}

export async function searchJobs(
  filters: SmartJobFilters,
  options: { limit?: number; offset?: number } = {},
): Promise<SearchJobsPage> {
  const limit = Math.min(
    Math.max(options.limit ?? DEFAULT_PAGE_SIZE, 1),
    200,
  );
  const offset = Math.max(options.offset ?? 0, 0);

  if (filters.qBranches && filters.qBranches.length >= 2) {
    return searchJobsRoundRobin(filters, { limit, offset });
  }

  const terms = queryTerms(filters);
  const primary = terms[0] || "";
  const fetchTerms = terms.slice(0, MAX_FETCH_TERMS);

  const companySearch = filters.intentId === "company";
  const relatedCategoryId = companySearch
    ? undefined
    : (filters.relatedCategoryId ??
      relatedCategoryFromTerms(terms)?.id ??
      undefined);

  const rankCtx: RankContext = {
    terms,
    primary,
    relatedCategoryId,
    companySearch,
  };

  if (
    terms.length === 0 &&
    filters.categoryId == null &&
    !filters.city &&
    filters.salaryMin == null &&
    filters.salaryMax == null &&
    !filters.hasSalary &&
    !filters.workingMode &&
    filters.uploadedSince !== "today"
  ) {
    return {
      results: [],
      total: 0,
      limit,
      offset,
      hasMore: false,
      nextOffset: null,
    };
  }

  // Category / filter browse with no text query — newest listing.
  if (terms.length === 0) {
    const todaySinceMs =
      filters.uploadedSince === "today" ? startOfTodayTbilisiMs() : undefined;
    const needsPostGate =
      filters.salaryMin != null ||
      filters.salaryMax != null ||
      !!filters.hasSalary ||
      filters.uploadedSince === "today";

    // Post-filters can drop rows. Materialize the FULL gated list (capped) so
    // page 1 already knows the real total — never grow pages as the user deep-links.
    if (needsPostGate) {
      const UPSTREAM_PAGE = 50;
      const MAX_UPSTREAM = 800;
      const gated: ScrapedJobRow[] = [];
      let upstreamOffset = 0;
      let upstreamHasMore = true;
      let hitOlderThanToday = false;

      while (
        upstreamHasMore &&
        !hitOlderThanToday &&
        upstreamOffset < MAX_UPSTREAM
      ) {
        const page = await fetchScrapedRows(filters, "", {
          limit: UPSTREAM_PAGE,
          offset: upstreamOffset,
        });
        upstreamHasMore = page.hasMore;
        if (page.rows.length === 0) break;
        for (const row of page.rows) {
          // Newest order: once we leave today's window, stop.
          if (
            todaySinceMs != null &&
            scrapedAtMs(row) > 0 &&
            scrapedAtMs(row) < todaySinceMs
          ) {
            hitOlderThanToday = true;
            break;
          }
          if (rowMatchesPostFilters(row, filters, todaySinceMs)) {
            gated.push(row);
          }
        }
        upstreamOffset += page.rows.length;
      }

      const slice = gated.slice(offset, offset + limit);
      const hasMore = offset + slice.length < gated.length;

      return {
        results: slice.map((row) => mapScrapedJob(row)),
        total: gated.length,
        limit,
        offset,
        hasMore,
        nextOffset: hasMore ? offset + slice.length : null,
      };
    }

    const { rows, total, hasMore } = await fetchScrapedRows(filters, "", {
      limit,
      offset,
    });
    return {
      results: rows.map((row) => mapScrapedJob(row)),
      total,
      limit,
      offset,
      hasMore: hasMore && rows.length > 0,
      nextOffset: hasMore && rows.length > 0 ? offset + rows.length : null,
    };
  }

  // Keyword search:
  // company → company/title only
  // else → title, description, related category fill
  // Fixed pool size so page 1 and page N share the same ranked list / total.
  // Growing the pool with offset made pagination invent new pages mid-browse.
  const poolLimit = RELEVANCE_POOL_MAX;

  // Keyword fetches must NOT AND the browse categoryId.
  const keywordFilters: SmartJobFilters = {
    ...filters,
    categoryId: undefined,
    categoryName: undefined,
  };

  const [companyPages, titlePages, descPages, categoryPage] = await Promise.all([
    Promise.all(
      fetchTerms.map((term) =>
        fetchScrapedRows(keywordFilters, term, {
          limit: poolLimit,
          offset: 0,
          qFields: "company",
          categoryId: null,
        }),
      ),
    ),
    Promise.all(
      fetchTerms.map((term) =>
        fetchScrapedRows(keywordFilters, term, {
          limit: poolLimit,
          offset: 0,
          qFields: "title",
          categoryId: null,
        }),
      ),
    ),
    companySearch
      ? Promise.resolve([] as Array<{
          rows: ScrapedJobRow[];
          total: number;
          hasMore: boolean;
        }>)
      : Promise.all(
          fetchTerms.map((term) =>
            fetchScrapedRows(keywordFilters, term, {
              limit: poolLimit,
              offset: 0,
              qFields: "description",
              categoryId: null,
            }),
          ),
        ),
    !companySearch && relatedCategoryId != null
      ? fetchScrapedRows(keywordFilters, "", {
          limit: poolLimit,
          offset: 0,
          categoryId: relatedCategoryId,
        })
      : Promise.resolve({ rows: [], total: 0, hasMore: false }),
  ]);

  const seen = new Set<string>();
  const merged: ScrapedJobRow[] = [];
  for (const page of [
    ...companyPages,
    ...titlePages,
    ...descPages,
    categoryPage,
  ]) {
    for (const row of page.rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      merged.push(row);
    }
  }

  const requireDaily =
    filters.preferPayCadence?.includes("daily") ||
    filters.preferRoleFamilies?.includes("day_labor");

  const todaySinceMs =
    filters.uploadedSince === "today" ? startOfTodayTbilisiMs() : undefined;

  const filtered = merged.filter((row) => {
    if (!rowMatchesPostFilters(row, filters, todaySinceMs)) return false;
    if (requireDaily) {
      const facets = inferJobFacets(
        row.title || "",
        stripHtml(row.description_html),
      );
      return (
        facets.role_family.includes("day_labor") ||
        /დღიურ/.test((row.title || "").toLowerCase())
      );
    }
    return matchTier(row, rankCtx) > 0;
  });

  const strongRows: ScrapedJobRow[] = [];
  const categoryRows: ScrapedJobRow[] = [];
  for (const row of filtered) {
    const tier = matchTier(row, rankCtx);
    if (tier === TIER_TITLE || tier === TIER_DESCRIPTION) strongRows.push(row);
    else if (tier === TIER_CATEGORY) categoryRows.push(row);
  }

  // Related-sector fill is only a fallback — keep the cap independent of the
  // current page size so totals don't change when the user paginates.
  const categoryFillCap =
    strongRows.length >= 20
      ? 0
      : Math.min(categoryRows.length, 40);
  const categoryFill = rankByTiers(categoryRows, rankCtx).slice(
    0,
    categoryFillCap,
  );
  const ranked = rankByTiers([...strongRows, ...categoryFill], rankCtx);
  const slice = ranked.slice(offset, offset + limit);
  const hasMore = offset + slice.length < ranked.length;

  return {
    results: slice.map((row) => mapScrapedJob(row, terms)),
    total: ranked.length,
    limit,
    offset,
    hasMore,
    nextOffset: hasMore ? offset + slice.length : null,
  };
}

/** Live count of active scraped jobs (sum of per-source counts). */
export async function fetchTotalJobs(): Promise<number> {
  const res = await fetch(
    `${getSamushaoApiBaseUrl()}/api/scraped-jobs/filters`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`scraped filters failed: ${res.status}`);
  const data = (await res.json()) as {
    total_jobs?: number;
    sources?: Array<{ count?: number }>;
  };
  // Prefer sum of source chips — matches the live index better than total_jobs.
  const fromSources = (data.sources || []).reduce(
    (sum, row) => sum + (Number(row.count) || 0),
    0,
  );
  if (fromSources > 0) return fromSources;
  return Number(data.total_jobs) || 0;
}
