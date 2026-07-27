import {
  categoriesPromptList,
  categoryById,
  categoryByName,
  matchCategoryFromQuery,
  relatedCategoryFromTerms,
} from "@/lib/search/categories";
import { intentToFilterFields, matchIntent } from "@/lib/search/intents";
import {
  bilingualSearchTerms,
  enrichLatinGeorgianQuery,
  looksLikeLatinGeorgian,
  transliterateToken,
} from "@/lib/search/ka-latin";
import { isSkillKeywordQuery, skillSearchFromQuery } from "@/lib/search/skill-keywords";
import type { PayCadence } from "@/lib/search/job-facets";

function uniqueSearchTerms(terms: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of terms) {
    const t = String(term || "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/**
 * Keep planner’s Georgian `q` as primary. Always OR-merge the user’s latin
 * typing + reverse-latin of the Georgian form — never invent wrong ტ/თ twins.
 */
function withBilingualTerms(
  filters: SmartJobFilters,
  rawQuery: string,
): SmartJobFilters {
  if (!filters.q) return filters;

  const rawLatin = rawQuery
    .trim()
    .split(/\s+/)
    .filter((t) => /^[a-z]+$/i.test(t) && t.length >= 3);

  // Reverse of planner q (დირექტორი → direktori) so KA/latin hit the same pool.
  const fromQ = bilingualSearchTerms(filters.q);
  const fromRaw = looksLikeLatinGeorgian(rawQuery)
    ? bilingualSearchTerms(rawQuery)
    : null;

  // Trust planner spelling when it already produced Mkhedruli.
  const primary = /[\u10A0-\u10FF]/.test(filters.q)
    ? filters.q
    : fromRaw?.q && /[\u10A0-\u10FF]/.test(fromRaw.q)
      ? fromRaw.q
      : filters.q;

  const scriptTwins = uniqueSearchTerms([
    ...rawLatin,
    fromQ.q,
    ...fromQ.qAlternates,
    // Phonetic hint only when planner left q in latin.
    !/[\u10A0-\u10FF]/.test(filters.q) ? fromRaw?.q : null,
  ]).filter((t) => t.toLowerCase() !== primary.toLowerCase());

  const plannerAlts = (filters.qAlternates || []).filter(
    (t) => t.toLowerCase() !== primary.toLowerCase(),
  );

  const alts = uniqueSearchTerms([...scriptTwins, ...plannerAlts]).slice(0, 8);
  return {
    ...filters,
    q: primary,
    qAlternates: alts.length ? alts : undefined,
  };
}

function finalizePlan(result: SmartQueryResult, raw: string): SmartQueryResult {
  if (!result.filters.q) return result;
  // Separate role branches are searched on their own — don't OR-merge them.
  if (result.filters.qBranches && result.filters.qBranches.length >= 2) {
    return result;
  }
  // Company/brands: never phonetic-map (tbc → ტბც).
  if (result.filters.intentId === "company") {
    return result;
  }
  return {
    ...result,
    filters: withBilingualTerms(result.filters, raw),
  };
}

function parseQBranches(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const branches = [
    ...new Set(
      raw
        .map((s) => String(s || "").trim())
        .filter((s) => s.length >= 2),
    ),
  ].slice(0, 4);
  return branches.length >= 2 ? branches : undefined;
}

/** Generic words that must not OR-expand a company search. */
const COMPANY_ALT_NOISE =
  /^(it|აითი|აიტი|developer|software(\s+developer)?|პროგრამისტი|programmer|engineer|bank|ბანკი?|company|კომპანია|group|ჯგუფი)$/i;

/** tbc→ტბც/თბც style junk — real names like თიბისი are longer than the acronym. */
function isAcronymLetterSoup(latinRaw: string, term: string): boolean {
  const compact = latinRaw.replace(/[^a-z]/gi, "").toLowerCase();
  if (compact.length < 2 || compact.length > 6) return false;
  if (!/^[\u10A0-\u10FF]+$/u.test(term)) return false;
  if ([...term].length !== compact.length) return false;
  const soup = transliterateToken(compact);
  // Same length as acronym + equals phonetic map (or one თ/ტ swap off).
  if (term === soup) return true;
  return [...term].every((ch, i) => {
    const s = soup[i];
    return ch === s || (ch === "თ" && s === "ტ") || (ch === "ტ" && s === "თ");
  });
}

/**
 * Keep employer name spellings from the user + model.
 * Do NOT phonetic-map brands (tbc → ტბც is wrong; თიბისი comes from Gemini).
 */
function clampToCompanySearch(
  filters: SmartJobFilters,
  rawQuery: string,
): SmartJobFilters {
  const raw = rawQuery.trim();
  const rawTokens = raw.split(/\s+/).filter((t) => t.length >= 2);

  const seed = uniqueSearchTerms([
    filters.q,
    ...(filters.qAlternates || []),
    raw,
    ...rawTokens,
    /^[a-z]+$/i.test(raw) ? raw.toUpperCase() : null,
  ]);

  const terms = seed.filter((t) => {
    if (COMPANY_ALT_NOISE.test(t)) {
      return t.toLowerCase() === raw.toLowerCase();
    }
    if (isAcronymLetterSoup(raw, t)) return false;
    return true;
  });

  // Prefer real Mkhedruli employer name when model provided one (თიბისი > TBC).
  const mkhedruli = terms.find(
    (t) => /^[\u10A0-\u10FF]{3,}$/u.test(t) && !isAcronymLetterSoup(raw, t),
  );
  const latinBrand = terms.find(
    (t) =>
      /^[A-Za-z0-9]/.test(t) &&
      rawTokens.some(
        (r) =>
          t.toLowerCase() === r.toLowerCase() ||
          t.toLowerCase().includes(r.toLowerCase()),
      ),
  );
  const primary = mkhedruli || latinBrand || terms[0] || raw;

  const alts = terms.filter((t) => t.toLowerCase() !== primary.toLowerCase());

  return {
    q: primary,
    qAlternates: alts.length ? alts.slice(0, 6) : undefined,
    city: filters.city,
    salaryMin: filters.salaryMin,
    salaryMax: filters.salaryMax,
    hasSalary: filters.hasSalary,
    workingMode: filters.workingMode,
    experience: filters.experience,
    employmentType: filters.employmentType,
    intentId: "company",
    order: "newest",
  };
}

/** Literal acronym/brand search — no Mkhedruli letter-soup. */
function literalCompanyPlan(raw: string): SmartQueryResult {
  const q = raw.trim();
  const upper = q.toUpperCase();
  return {
    filters: {
      q: upper !== q ? upper : q,
      qAlternates:
        upper !== q ? [q] : q !== q.toLowerCase() ? [q.toLowerCase()] : undefined,
      intentId: "company",
      order: "newest",
    },
    interpretation: q,
    fromGemini: false,
  };
}

export type SmartJobFilters = {
  /** Primary keyword for Samushao `q` (single short token/phrase) */
  q: string;
  /** Extra short keywords OR-merged with `q` */
  qAlternates?: string[];
  /**
   * Distinct role queries to search separately and interleave (round-robin).
   * Set when the user listed multiple jobs, not one compound title.
   * e.g. ბუღალტერი მოლარე → ["ბუღალტერი", "მოლარე"]
   */
  qBranches?: string[];
  /** Premade Samushao category — preferred when query matches a category */
  categoryId?: number;
  categoryName?: string;
  /**
   * Related sector used only as fill-in tier after title/description matches.
   * e.g. keyword ბუღალტერი → relatedCategoryId 20 (ბუღალტერია)
   */
  relatedCategoryId?: number;
  relatedCategoryName?: string;
  city?: string;
  salaryMin?: number;
  salaryMax?: number;
  /** Only jobs that list a numeric salary (მხოლოდ ხელფასიანი) */
  hasSalary?: boolean;
  workingMode?: "remote" | "onsite";
  /** Values from Samushao experience filter labels */
  experience?: string[];
  employmentType?: string;
  /**
   * Only jobs scraped/uploaded on this calendar day (Asia/Tbilisi).
   * "დღევანდელი ვაკანსიები" → today — not a keyword search.
   */
  uploadedSince?: "today";
  order?: "newest";
  /** Hidden ranking hints — not shown in UI */
  preferRoleFamilies?: string[];
  preferSkills?: string[];
  preferPayCadence?: PayCadence[];
  intentId?: string;
};

export type SmartQueryResult = {
  filters: SmartJobFilters;
  /** Short Georgian explanation of what we understood */
  interpretation: string;
  fromGemini: boolean;
  /** Query is emoji / gibberish / has no job meaning — return zero hits */
  noResults?: boolean;
};

function emptySearchResult(fromGemini = false): SmartQueryResult {
  return {
    filters: { q: "" },
    interpretation: "გაუგებარი ძებნა",
    fromGemini,
    noResults: true,
  };
}

/** Emoji / symbols / no real letters — not a job query. */
function isObviouslyNonsensical(raw: string): boolean {
  const text = raw.trim();
  if (!text) return true;
  // Keep letters only (Latin, Mkhedruli, etc.)
  const letters = text.replace(/[^\p{L}\p{M}]+/gu, "");
  return letters.length < 2;
}

/**
 * Tiny latin fragments like "das" / "asdf" stubs that aren't real skills.
 * Must NOT be phonetic-mapped (das→დას→დასუფთავება cleaners).
 */
function isShortLatinStub(raw: string): boolean {
  const t = raw.trim();
  if (!/^[a-z]{1,3}$/i.test(t)) return false;
  if (isSkillKeywordQuery(t)) return false;
  if (CITY_ALIASES[t.toLowerCase()]) return false;
  return true;
}

/** 1–2 Mkhedruli letters alone — not a searchable role. */
function isShortMkhedruliStub(raw: string): boolean {
  return /^[\u10A0-\u10FF]{1,2}$/u.test(raw.trim());
}

const EXPERIENCE_LABELS = [
  "სტაჟირება",
  "0-1 წელი",
  "1-2 წელი",
  "3-5 წელი",
  "5+ წელი",
] as const;

const CITIES = [
  "თბილისი",
  "ქუთაისი",
  "ბათუმი",
  "ზუგდიდი",
  "გორი",
  "რუსთავი",
  "მცხეთა",
  "თელავი",
  "მესტია",
  "ფოთი",
  "ჭიათურა",
  "ზესტაფონი",
  "მარნეული",
] as const;

/** Latin / informal city spellings → canonical Georgian. */
const CITY_ALIASES: Record<string, (typeof CITIES)[number]> = {
  tbilisi: "თბილისი",
  batumi: "ბათუმი",
  qutaisi: "ქუთაისი",
  kutaisi: "ქუთაისი",
  rustavi: "რუსთავი",
  zugdidi: "ზუგდიდი",
  gori: "გორი",
  poti: "ფოთი",
  telavi: "თელავი",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when the user asked for jobs uploaded/posted today (Tbilisi day). */
export function wantsUploadedToday(text: string): boolean {
  const raw = text.trim();
  if (!raw) return false;
  // დღიური / ყოველდღიური = day wage — must not trigger "today".
  if (/დღევანდელ/i.test(raw)) return true;
  if (
    /(?:^|[^\p{L}])დღეს(?:\s*(?:ატვირთულ|გამოქვეყნებულ|დამატებულ|ახალ)?(?:ი|ა|ის)?)?(?=$|[^\p{L}])/iu.test(
      raw,
    )
  ) {
    return true;
  }
  if (/\btoday(?:'?s)?(?:\s+jobs?)?\b/i.test(raw)) return true;
  if (/\buploaded\s+today\b/i.test(raw)) return true;
  return false;
}

/** Strip today-phrases so they never become keyword search terms. */
export function stripTodayPhrases(text: string): string {
  return text
    .replace(/დღევანდელ(?:ი|ის|ს|ად)?(?:\s*ვაკანსი(?:ა|ები)?)?/giu, " ")
    .replace(
      /(?:^|[^\p{L}])დღეს(?:\s*(?:ატვირთულ|გამოქვეყნებულ|დამატებულ|ახალ)?(?:ი|ა|ის)?)?(?=$|[^\p{L}])/giu,
      " ",
    )
    .replace(/\btoday(?:'?s)?(?:\s+jobs?)?\b/gi, " ")
    .replace(/\buploaded\s+today\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map seniority words → Samushao experience labels. */
function extractExperienceLabel(
  text: string,
): (typeof EXPERIENCE_LABELS)[number] | undefined {
  const raw = text.trim();
  if (!raw) return undefined;
  if (/სტაჟირ|სტაჟიორ|\bintern(?:ship)?\b|\btrainee\b/i.test(raw)) {
    return "სტაჟირება";
  }
  if (
    /დამწყებ|ჯუნიორ|\bjunior\b|entry[\s-]?level|0\s*[-–—]\s*1\s*წელ/i.test(raw)
  ) {
    return "0-1 წელი";
  }
  if (/\bmid[\s-]?level\b|საშუალო\s*დონ|1\s*[-–—]\s*2\s*წელ/i.test(raw)) {
    return "1-2 წელი";
  }
  if (/3\s*[-–—]\s*5\s*წელ/i.test(raw)) return "3-5 წელი";
  if (/სენიორ|\bsenior\b|5\s*\+\s*წელ|გამოცდილ(?:ი|ებით)/i.test(raw)) {
    return "5+ წელი";
  }
  return undefined;
}

/**
 * Keep only the job-role phrase. Strip salary / city / seniority / "today"
 * so we never OR-search "2000" or "დამწყები" as separate keywords.
 */
export function stripConstraintPhrases(text: string): string {
  let out = stripTodayPhrases(text);
  out = out
    .replace(
      /(\d{3,5})\s*(?:ლარ(?:ი|ის|ს)?|₾|gel)?\s*(?:ზევით|ზემოთ|დან|\+|from|above|over|მდე|ამდე)?/giu,
      " ",
    )
    .replace(
      /(?:მინიმუმ|დან|from|above|over|at\s*least|მდე|ამდე|მაქს)\s*(\d{3,5})/giu,
      " ",
    )
    .replace(/\b\d{3,5}\b/g, " ")
    .replace(
      /დამწყებ(?:ი|ის|ს|ად)?|ჯუნიორ(?:ი|ის)?|\bjunior\b|entry[\s-]?level|სტაჟირებ(?:ა|ის)?|სტაჟიორ(?:ი|ის)?|\bintern(?:ship)?\b|\btrainee\b|სენიორ(?:ი|ის)?|\bsenior\b|mid[\s-]?level|საშუალო\s*დონ(?:ე|ის)?/giu,
      " ",
    )
    .replace(
      /მხოლოდ|ხელფასიან(?:ი|ა)?|ხელფასი|ლარ(?:ი|ის|ს|იდან)?|₾|\bgel\b|ზევით|ზემოთ|remote|onsite|work\s*from\s*home|დისტანციურ(?:ი|ად)?|ოფისში|ადგილზე/giu,
      " ",
    );

  for (const city of CITIES) {
    const stem = city.endsWith("ი") ? city.slice(0, -1) : city;
    out = out.replace(
      new RegExp(
        `(?:^|\\s)(?:${escapeRegExp(city)}|${escapeRegExp(stem)}(?:ში|ის)?)(?=\\s|$)`,
        "giu",
      ),
      " ",
    );
  }
  for (const alias of Object.keys(CITY_ALIASES)) {
    out = out.replace(
      new RegExp(`(?:^|\\s)${escapeRegExp(alias)}(?=\\s|$)`, "gi"),
      " ",
    );
  }

  return out.replace(/\s+/g, " ").trim();
}

/**
 * Pull city / remote / salary from the raw text so compound queries
 * ("გაყიდვები ბათუმი") never lose location even if a fast-path fires.
 */
function extractLocalFacets(text: string): Partial<SmartJobFilters> {
  const raw = text.trim();
  if (!raw) return {};
  const lower = raw.toLowerCase();
  const extras: Partial<SmartJobFilters> = {};

  for (const city of CITIES) {
    const stem = city.endsWith("ი") ? city.slice(0, -1) : city;
    const pattern = new RegExp(
      `(?:^|[^\\p{L}])(?:${escapeRegExp(city)}|${escapeRegExp(stem)}(?:ში|ის)?)(?=$|[^\\p{L}])`,
      "iu",
    );
    if (pattern.test(raw)) {
      extras.city = city;
      break;
    }
  }
  if (!extras.city) {
    for (const [alias, city] of Object.entries(CITY_ALIASES)) {
      if (
        new RegExp(`(?:^|\\s)${escapeRegExp(alias)}(?:\\s|$)`, "i").test(lower)
      ) {
        extras.city = city;
        break;
      }
    }
  }

  if (/დისტანც|remote|work\s*from\s*home|wfh/i.test(raw)) {
    extras.workingMode = "remote";
  } else if (/ადგილზე|ოფისში|onsite|on-site/i.test(raw)) {
    extras.workingMode = "onsite";
  }

  if (
    /ხელფასიან|მითითებული\s*ხელფას|მხოლოდ\s*ხელფას|with\s*salary|salary\s*listed|paid\s*only/i.test(
      raw,
    )
  ) {
    extras.hasSalary = true;
  }

  // Seniority / experience adjectives → Samushao experience facet (not a separate role).
  const experience = extractExperienceLabel(raw);
  if (experience) {
    extras.experience = [experience];
  }

  // "დღევანდელი" / "დღეს ატვირთული" / "today" — NOT "დღიური" (day labor).
  if (wantsUploadedToday(raw)) {
    extras.uploadedSince = "today";
  }

  // "2000 ლარის ზევით" / "2000 ლარიდან" / "2000+" / "from 2000"
  const minAbove = raw.match(
    /(\d{3,5})\s*(?:ლარ(?:ი|ის|ს)?|₾|gel)?\s*(?:ზევით|ზემოთ|დან|\+|from|above|over)/i,
  );
  const minFrom = raw.match(
    /(?:მინიმუმ|დან|from|above|over|at\s*least)\s*(\d{3,5})/i,
  );
  const maxUntil = raw.match(
    /(\d{3,5})\s*(?:ლარ(?:ი|ის|ს)?|₾|gel)?\s*(?:მდე|ამდე|მაქს)/i,
  );
  const range = raw.match(
    /(\d{3,5})\s*[-–—]\s*(\d{3,5})\s*(?:ლარ(?:ი|ის|ს)?|₾|gel)?/i,
  );
  const bare = raw.match(/(\d{3,5})\s*(?:ლარ(?:ი|ის|ს)?|₾|gel)/i);

  if (minAbove) {
    const n = Number(minAbove[1]);
    if (Number.isFinite(n) && n >= 100) extras.salaryMin = n;
  } else if (minFrom) {
    const n = Number(minFrom[1]);
    if (Number.isFinite(n) && n >= 100) extras.salaryMin = n;
  } else if (maxUntil) {
    const n = Number(maxUntil[1]);
    if (Number.isFinite(n) && n >= 100) extras.salaryMax = n;
  } else if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (Number.isFinite(a) && a >= 100) extras.salaryMin = a;
    if (Number.isFinite(b) && b >= 100) extras.salaryMax = b;
  } else if (bare) {
    const n = Number(bare[1]);
    if (Number.isFinite(n) && n >= 100) extras.salaryMin = n;
  }

  if (extras.salaryMin != null || extras.salaryMax != null) {
    extras.hasSalary = true;
  }

  return extras;
}

function salaryInterpretationBits(filters: SmartJobFilters): string[] {
  const bits: string[] = [];
  if (filters.hasSalary && filters.salaryMin == null && filters.salaryMax == null) {
    bits.push("ხელფასიანი");
  }
  if (filters.salaryMin != null && filters.salaryMax != null) {
    bits.push(`${filters.salaryMin}–${filters.salaryMax} ₾`);
  } else if (filters.salaryMin != null) {
    bits.push(`${filters.salaryMin}+ ₾`);
  } else if (filters.salaryMax != null) {
    bits.push(`≤${filters.salaryMax} ₾`);
  }
  return bits;
}

function mergeLocalFacets(
  result: SmartQueryResult,
  query: string,
): SmartQueryResult {
  const local = extractLocalFacets(query);
  const filters: SmartJobFilters = {
    ...result.filters,
    city: result.filters.city || local.city,
    salaryMin: result.filters.salaryMin ?? local.salaryMin,
    salaryMax: result.filters.salaryMax ?? local.salaryMax,
    hasSalary: result.filters.hasSalary || local.hasSalary || undefined,
    workingMode: result.filters.workingMode || local.workingMode,
    experience: result.filters.experience?.length
      ? result.filters.experience
      : local.experience,
    uploadedSince:
      result.filters.uploadedSince || local.uploadedSince || undefined,
  };
  if (filters.salaryMin != null || filters.salaryMax != null) {
    filters.hasSalary = true;
  }

  // Constraints are filters — never leftover keyword soup.
  const cleanedQ = stripConstraintPhrases(filters.q || "");
  filters.q = cleanedQ;
  if (filters.qAlternates?.length) {
    const alts = filters.qAlternates
      .map(stripConstraintPhrases)
      .filter((s) => s && s.toLowerCase() !== cleanedQ.toLowerCase())
      // Drop single-token shreds of the role phrase (OR-flood).
      .filter((s) => s.includes(" ") || s.length >= 4);
    filters.qAlternates = alts.length ? alts.slice(0, 8) : undefined;
  }
  if (filters.qBranches?.length) {
    const branches = filters.qBranches
      .map(stripConstraintPhrases)
      .filter(Boolean);
    filters.qBranches = branches.length >= 2 ? branches : undefined;
    if (filters.qBranches) filters.q = filters.qBranches.join(" ");
  }

  let interpretation = result.interpretation;
  if (filters.uploadedSince === "today") {
    if (!/დღევანდელ|დღეს\s*ატვირთ|today/i.test(interpretation)) {
      interpretation = interpretation
        ? `${interpretation} · დღევანდელი`
        : "დღევანდელი ვაკანსიები";
    }
    if (!filters.q && !filters.city && filters.categoryId == null) {
      interpretation = "დღევანდელი ვაკანსიები";
    }
  }
  if (filters.experience?.length) {
    const exp = filters.experience.join(", ");
    if (!interpretation.includes(exp)) {
      interpretation = interpretation
        ? `${interpretation} · ${exp}`
        : exp;
    }
  }
  if (filters.city && !interpretation.includes(filters.city)) {
    interpretation = `${interpretation} · ${filters.city}`;
  }
  for (const bit of salaryInterpretationBits(filters)) {
    if (!interpretation.includes(bit)) {
      interpretation = `${interpretation} · ${bit}`;
    }
  }
  return { ...result, filters, interpretation };
}

function categoryOnlyResult(
  category: { id: number; name: string },
  extras: Partial<SmartJobFilters> = {},
  fromGemini = false,
): SmartQueryResult {
  const filters: SmartJobFilters = {
    q: "",
    categoryId: category.id,
    categoryName: category.name,
    city: extras.city,
    salaryMin: extras.salaryMin,
    salaryMax: extras.salaryMax,
    hasSalary: extras.hasSalary,
    workingMode: extras.workingMode,
    experience: extras.experience,
    employmentType: extras.employmentType,
    order: "newest",
  };
  if (filters.salaryMin != null || filters.salaryMax != null) {
    filters.hasSalary = true;
  }
  const bits = [
    `კატეგორია: ${category.name}`,
    filters.city,
    ...salaryInterpretationBits(filters),
  ].filter(Boolean);
  return {
    filters,
    interpretation: bits.join(" · "),
    fromGemini,
  };
}

function skillKeywordResult(raw: string): SmartQueryResult {
  const skill = skillSearchFromQuery(raw);
  return {
    filters: {
      q: skill.q,
      qAlternates: skill.qAlternates,
      preferRoleFamilies: skill.preferRoleFamilies,
      preferSkills: skill.preferSkills,
      order: "newest",
    },
    interpretation: skill.q,
    fromGemini: false,
  };
}

function intentResult(raw: string): SmartQueryResult | null {
  const intent = matchIntent(raw);
  if (!intent) return null;
  const fields = intentToFilterFields(intent);
  return {
    filters: {
      q: fields.q,
      qAlternates: fields.qAlternates,
      preferRoleFamilies: fields.preferRoleFamilies,
      preferSkills: fields.preferSkills,
      preferPayCadence: fields.preferPayCadence,
      intentId: intent.id,
      order: "newest",
    },
    interpretation: fields.interpretation,
    fromGemini: false,
  };
}

/** Try intent / category match across latin + Mkhedruli variants. */
function matchAcrossVariants(variants: string[]): {
  intent: SmartQueryResult | null;
  category: ReturnType<typeof matchCategoryFromQuery>;
} {
  for (const v of variants) {
    const intent = intentResult(v);
    if (intent) return { intent, category: null };
  }
  for (const v of variants) {
    const category = matchCategoryFromQuery(v);
    if (category) return { intent: null, category };
  }
  return { intent: null, category: null };
}

function fallbackFromRaw(raw: string): SmartQueryResult {
  const enriched = enrichLatinGeorgianQuery(raw.trim());
  const text = enriched.query || raw.trim();
  const local = extractLocalFacets(text);
  const { intent, category } = matchAcrossVariants(
    enriched.variants.length ? enriched.variants : [text],
  );
  if (intent) return mergeLocalFacets(intent, text);
  if (isSkillKeywordQuery(raw) || isSkillKeywordQuery(text)) {
    return mergeLocalFacets(
      skillKeywordResult(isSkillKeywordQuery(raw) ? raw : text),
      text,
    );
  }
  if (category) return categoryOnlyResult(category, local);

  // Role phrase only — salary / seniority / city are filters, not OR keywords.
  const rolePhrase = stripConstraintPhrases(text);
  const tokens = rolePhrase.split(/\s+/).filter(Boolean);

  // Pure "დღევანდელი ვაკანსიები" — newest uploads from today only.
  if (!tokens.length && local.uploadedSince === "today") {
    return mergeLocalFacets(
      {
        filters: { q: "", uploadedSince: "today", order: "newest" },
        interpretation: "დღევანდელი ვაკანსიები",
        fromGemini: false,
      },
      text,
    );
  }

  // Pure salary constraint (e.g. "მხოლოდ ხელფასიანი") — no keyword search.
  if (!tokens.length && (local.hasSalary || local.salaryMin != null)) {
    return mergeLocalFacets(
      {
        filters: { q: "", hasSalary: true, order: "newest" },
        interpretation: "მხოლოდ ხელფასიანი",
        fromGemini: false,
      },
      text,
    );
  }

  // One role phrase as a whole (ბუღალტერი), plus latin twin — never token soup.
  const bi = bilingualSearchTerms(rolePhrase || raw.trim());
  const q = stripConstraintPhrases(bi.q || rolePhrase || "");
  const qAlternates = bi.qAlternates
    .map(stripConstraintPhrases)
    .filter((s) => s && s.toLowerCase() !== q.toLowerCase())
    .slice(0, 8);

  return mergeLocalFacets(
    {
      filters: {
        q,
        qAlternates: qAlternates.length ? qAlternates : undefined,
        experience: local.experience,
        uploadedSince: local.uploadedSince,
        order: "newest",
      },
      interpretation: text,
      fromGemini: false,
    },
    text,
  );
}

function resolveCategory(
  raw: Partial<SmartJobFilters> & {
    categoryId?: number | null;
    categoryName?: string | null;
  },
): { id: number; name: string } | null {
  if (raw.categoryId != null && Number.isFinite(Number(raw.categoryId))) {
    const byId = categoryById(Number(raw.categoryId));
    if (byId) return byId;
  }
  if (raw.categoryName) {
    const byName = categoryByName(String(raw.categoryName));
    if (byName) return byName;
  }
  return null;
}

function normalizeFilters(
  raw: Partial<SmartJobFilters> & {
    q?: string;
    qAlternates?: string[];
    qBranches?: string[];
    qMode?: string;
  },
  fallbackQ: string,
): SmartJobFilters {
  const category = resolveCategory(raw);
  const qBranches = parseQBranches(raw.qBranches);

  let q = String(raw.q || "").trim();
  const cityEarly =
    String(raw.city || "").trim() ||
    extractLocalFacets(fallbackQ).city ||
    undefined;

  // Category browse: don't AND a weak text query that excludes the category.
  if (category) {
    const qNorm = q.toLowerCase();
    const catNorm = category.name.toLowerCase();
    if (
      !q ||
      qNorm === catNorm ||
      catNorm.includes(qNorm) ||
      qNorm.includes(catNorm) ||
      qNorm === fallbackQ.trim().toLowerCase()
    ) {
      q = "";
    }
  } else if (!q) {
    // Never fill q from a city-only ask or a pure "დღევანდელი" date ask.
    const fallback = stripTodayPhrases(fallbackQ.trim());
    if (!fallback || isCityOnlyText(fallback, cityEarly)) {
      q = "";
    } else {
      q = fallback;
    }
  }

  // Date phrases must never survive as keyword search terms.
  if (q) {
    q = stripTodayPhrases(q);
  }

  if (qBranches) {
    q = qBranches.join(" ");
  } else if (q && q.split(/\s+/).length > 2) {
    // If model still returned a long phrase, keep the strongest latin token.
    const latin = q
      .split(/\s+/)
      .find((part) => /^[A-Za-z][A-Za-z0-9.+#/-]*$/.test(part));
    if (latin) q = latin;
    else q = q.split(/\s+/)[0] || q;
  }

  const city = cityEarly;

  // City browse: never AND city with q=city (that drops most city jobs).
  if (city && isCityToken(q, city)) {
    q = "";
  }

  const qAlternates =
    category || qBranches || !q || !Array.isArray(raw.qAlternates)
      ? undefined
      : [
          ...new Set(
            raw.qAlternates
              .map((s) => String(s || "").trim())
              .filter((s) => s && s.toLowerCase() !== q.toLowerCase())
              .filter((s) => !isCityToken(s, city))
              .map((s) =>
                s.split(/\s+/).length > 2 ? s.split(/\s+/)[0] || s : s,
              ),
          ),
        ].slice(0, 8);

  let salaryMin =
    raw.salaryMin != null && Number.isFinite(Number(raw.salaryMin))
      ? Math.round(Number(raw.salaryMin))
      : undefined;
  let salaryMax =
    raw.salaryMax != null && Number.isFinite(Number(raw.salaryMax))
      ? Math.round(Number(raw.salaryMax))
      : undefined;
  if (salaryMin != null && salaryMin <= 0) salaryMin = undefined;
  if (salaryMax != null && salaryMax <= 0) salaryMax = undefined;
  if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) {
    [salaryMin, salaryMax] = [salaryMax, salaryMin];
  }

  const hasSalaryFlag =
    raw.hasSalary === true ||
    String(raw.hasSalary || "").toLowerCase() === "true";
  const hasSalary =
    hasSalaryFlag || salaryMin != null || salaryMax != null
      ? true
      : undefined;

  const workingMode =
    raw.workingMode === "remote" || raw.workingMode === "onsite"
      ? raw.workingMode
      : undefined;

  const experience = Array.isArray(raw.experience)
    ? raw.experience
        .map((s) => String(s || "").trim())
        .filter((s): s is (typeof EXPERIENCE_LABELS)[number] =>
          (EXPERIENCE_LABELS as readonly string[]).includes(s),
        )
    : undefined;

  const employmentType =
    String(raw.employmentType || "").trim() || undefined;

  const preferRoleFamilies = Array.isArray(raw.preferRoleFamilies)
    ? [...new Set(raw.preferRoleFamilies.map((s) => String(s).trim()).filter(Boolean))]
    : undefined;
  const preferSkills = Array.isArray(raw.preferSkills)
    ? [...new Set(raw.preferSkills.map((s) => String(s).trim()).filter(Boolean))]
    : undefined;
  const preferPayCadence = Array.isArray(raw.preferPayCadence)
    ? (raw.preferPayCadence.filter((s) =>
        ["daily", "monthly", "hourly", "unknown"].includes(String(s)),
      ) as PayCadence[])
    : undefined;

  // Related sector for tier-3 fill (title → description → category).
  let relatedCategory =
    raw.relatedCategoryId != null && Number.isFinite(Number(raw.relatedCategoryId))
      ? categoryById(Number(raw.relatedCategoryId))
      : null;
  if (!relatedCategory && raw.relatedCategoryName) {
    relatedCategory = categoryByName(String(raw.relatedCategoryName));
  }
  if (!relatedCategory && !category) {
    relatedCategory = relatedCategoryFromTerms([
      q,
      ...(qAlternates || []),
      fallbackQ,
    ]);
  }

  return {
    q,
    qAlternates: qAlternates?.length ? qAlternates : undefined,
    qBranches,
    categoryId: category?.id,
    categoryName: category?.name,
    relatedCategoryId: qBranches ? undefined : relatedCategory?.id,
    relatedCategoryName: qBranches ? undefined : relatedCategory?.name,
    city,
    salaryMin,
    salaryMax,
    hasSalary: hasSalary || undefined,
    workingMode,
    experience: experience?.length ? experience : undefined,
    employmentType,
    preferRoleFamilies: preferRoleFamilies?.length
      ? preferRoleFamilies
      : undefined,
    preferSkills: preferSkills?.length ? preferSkills : undefined,
    preferPayCadence: preferPayCadence?.length ? preferPayCadence : undefined,
    intentId: raw.intentId ? String(raw.intentId) : undefined,
    uploadedSince:
      raw.uploadedSince === "today" ||
      extractLocalFacets(fallbackQ).uploadedSince === "today"
        ? "today"
        : undefined,
    order: "newest",
  };
}

function extractJsonObject(text: string): unknown {
  const cleaned = text.trim().replace(/^```json?\s*|\s*```$/g, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("no_json");
  }
}

function cityStem(city: string): string {
  return city.endsWith("ი") ? city.slice(0, -1) : city;
}

function isCityToken(token: string, city?: string): boolean {
  const t = token.trim().toLowerCase();
  if (!t) return false;
  if (CITY_ALIASES[t]) return true;
  for (const c of CITIES) {
    const stem = cityStem(c).toLowerCase();
    if (t === c.toLowerCase() || t === `${stem}ში` || t === `${stem}ის`) {
      return true;
    }
  }
  if (city) {
    const stem = cityStem(city).toLowerCase();
    if (t === city.toLowerCase() || t === `${stem}ში` || t === `${stem}ის`) {
      return true;
    }
  }
  return false;
}

/** True when the whole query is just a city (plus optional fluff). */
function isCityOnlyText(text: string, city?: string): boolean {
  const stripped = text
    .trim()
    .toLowerCase()
    .replace(
      /^(ვეძებ|მინდა|მაპოვე|იპოვე|ძებნა|search|find|looking for)\s+/i,
      "",
    )
    .replace(
      /\s+(ვაკანსია|ვაკანსიები|სამუშაო|სამსახური|job|jobs|work)$/i,
      "",
    )
    .trim();
  if (!stripped) return false;
  if (isCityToken(stripped, city)) return true;
  const tokens = stripped.split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((t) => isCityToken(t, city));
}

/** Drop salary-constraint words from q — they are filters, not keywords. */
function sanitizeSalaryOnlyQuery(filters: SmartJobFilters): SmartJobFilters {
  const q = (filters.q || "").trim();
  if (!q) return filters;
  const cleaned = q
    .replace(/მხოლოდ/gi, " ")
    .replace(/ხელფასიან(ი|ები)?/gi, " ")
    .replace(
      /\d{3,5}\s*(?:ლარ(?:ი|ის|ს)?|₾|gel)?\s*(?:ზევით|ზემოთ|დან|მდე|ამდე|\+)?/gi,
      " ",
    )
    .replace(/with\s*salary|salary\s*listed|paid\s*only/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (
    !cleaned &&
    (filters.hasSalary || filters.salaryMin != null || filters.salaryMax != null)
  ) {
    return { ...filters, q: "", qAlternates: undefined };
  }
  return filters;
}

function geminiModelCandidates(): string[] {
  const preferred =
    process.env.GEMINI_MODEL ||
    process.env.GEMINI_SEARCH_MODEL ||
    "gemini-3.1-flash-lite";
  // Newer Flash variants have separate free-tier quotas from 2.5-*.
  return [
    ...new Set(
      [
        preferred,
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
        "gemini-2.5-flash",
      ].filter(Boolean),
    ),
  ];
}

const PLAN_CACHE_TTL_MS = 30 * 60 * 1000;
const PLAN_CACHE_MAX = 400;
const GEMINI_TIMEOUT_MS = 1800;
const planCache = new Map<string, { at: number; value: SmartQueryResult }>();

function cacheGet(key: string): SmartQueryResult | null {
  const hit = planCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > PLAN_CACHE_TTL_MS) {
    planCache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key: string, value: SmartQueryResult): void {
  if (planCache.size >= PLAN_CACHE_MAX) {
    const oldest = planCache.keys().next().value;
    if (oldest != null) planCache.delete(oldest);
  }
  planCache.set(key, { at: Date.now(), value });
}

/** Cache under the raw query AND every synonym so EN/KA hit the same plan. */
function cachePlanCluster(rawKey: string, value: SmartQueryResult): void {
  cacheSet(rawKey, value);
  const terms = [
    value.filters.q,
    ...(value.filters.qAlternates || []),
    ...enrichLatinGeorgianQuery(rawKey).variants,
  ];
  for (const term of terms) {
    const k = String(term || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (k && k !== rawKey) cacheSet(k, value);
  }
}

/**
 * Local plan is enough only for deterministic filters.
 * Role/title keywords (პროგრამისტი, დეველოპერი, frontend, …) MUST go to Gemini
 * so it invents a shared synonym cluster — not a hardcoded lexicon.
 */
function localPlanConfident(result: SmartQueryResult, text: string): boolean {
  const f = result.filters;
  if (f.intentId === "day_labor") return true;
  // Exact tools / languages only (javascript, react, figma…)
  if (isSkillKeywordQuery(text) && f.q) return true;
  if (f.categoryId != null) return true;
  if (f.city && !f.q) return true;
  if ((f.hasSalary || f.salaryMin != null || f.salaryMax != null) && !f.q) {
    return true;
  }
  // "დღევანდელი ვაკანსიები" is a date filter — no Gemini keyword soup.
  if (f.uploadedSince === "today" && !f.q) return true;
  return false;
}

async function callGeminiPlanner(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[smart-query] gemini http", model, res.status, body);
      return { ok: false, status: res.status };
    }
    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim();
    if (!text) return { ok: false, status: 204 };
    return { ok: true, text };
  } catch {
    return { ok: false, status: 408 };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Translate a chat-like natural language job search into structured
 * Samushao scraped-jobs filters. Local-first for speed; Gemini only when needed.
 */
export async function interpretJobQuery(
  rawQuery: string,
): Promise<SmartQueryResult> {
  const raw = rawQuery.trim();
  if (!raw) return emptySearchResult(false);

  if (isObviouslyNonsensical(raw) || isShortMkhedruliStub(raw)) {
    const empty = emptySearchResult(false);
    cacheSet(raw.toLowerCase().replace(/\s+/g, " "), empty);
    return empty;
  }

  // Phonetic hint only — Gemini supplies correct literary Mkhedruli.
  const enriched = enrichLatinGeorgianQuery(raw);
  const planned = enriched.query || raw;
  const rawKey = raw.toLowerCase().replace(/\s+/g, " ");
  const plannedKey = planned.toLowerCase().replace(/\s+/g, " ");
  const cached = cacheGet(rawKey) || cacheGet(plannedKey);
  if (cached) return { ...cached, filters: { ...cached.filters } };

  const shortLatinBrand = isShortLatinStub(raw);

  // Latin-typed Georgian roles must hit Gemini (not a dumb letter map).
  // Short brands (tbc, bog): never phonetic-map — literal company plan as fallback.
  const local = shortLatinBrand
    ? literalCompanyPlan(raw)
    : finalizePlan(mergeLocalFacets(fallbackFromRaw(raw), planned), raw);
  const skipGeminiForLatinRole =
    (looksLikeLatinGeorgian(raw) || shortLatinBrand) &&
    !localPlanConfident(local, raw);

  if (
    !shortLatinBrand &&
    !skipGeminiForLatinRole &&
    (localPlanConfident(local, planned) || localPlanConfident(local, raw))
  ) {
    cachePlanCluster(rawKey, local);
    return local;
  }

  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GEMINI_CV_READER_API_KEY;
  if (!apiKey) {
    cachePlanCluster(rawKey, local);
    return local;
  }

  const prompt = `You are the semantic query planner for Recruiter.ge (Georgia job search over Samushao).
Convert the user message into structured filters. For job ROLES/TITLES you MUST invent a synonym cluster — do not search only the literal word.

NONSENSE (critical):
If the message is only emoji, symbols, keyboard spam, gibberish, a random short fragment, or otherwise has NO job-search meaning in Georgian or English, return EXACTLY:
{"noResults":true,"q":"","interpretation":"გაუგებარი ძებნა"}
Examples that are NOT jobs (return noResults): das, asd, qwe, xyz, aaa, ლლლ
Do NOT invent a role from a fragment. Do NOT pick a category. Do NOT search description substrings for nonsense.

COMPANY / EMPLOYER (critical):
If the user typed a company or brand name (EPAM, TBC, TBC Bank, Bog, Magnoli, Redberry, …), this is a COMPANY search — NOT a job-role search.
Return:
- queryType: "company"
- q: the name as used on Georgian job boards (often Mkhedruli for local firms: TBC/tbc/tbc bank → თიბისი; EPAM → EPAM)
- qAlternates: ONLY real other spellings of THAT employer, including the user's typing (tbc, TBC, TBC Bank, თიბისი)
- NEVER letter-by-letter latin→Mkhedruli junk (tbc ↛ ტბც/თბც; use თიბისი)
- relatedCategoryId: null (do NOT attach a sector)
- categoryId: null
- preferRoleFamilies: omit
Do NOT expand a company into its industry. epam → EPAM jobs only, not all IT jobs. tbc → თიბისი jobs only, not all banks.

ONE INTENT / WHOLE QUERY (critical):
Treat the user message as ONE job search, not a shopping list of keywords.
Example: "დამწყები ბუღალტერი 2000 ლარიდან" = beginner accountant jobs paying ≥2000 ₾.
Return ONE combined plan:
- qMode: "combined"
- q: "ბუღალტერი" (role only — strip seniority and salary words from q)
- experience: ["0-1 წელი"]  (დამწყები / junior / ჯუნიორ)
- salaryMin: 2000, hasSalary: true
- qAlternates: ONLY role synonyms (accountant, …) — NEVER "დამწყები", "2000", "ლარიდან"
Seniority adjectives are NOT separate jobs. "დამწყები ბუღალტერი" ≠ qBranches.

MULTI-ROLE vs COMBINED TITLE (critical):
Decide if the user listed several distinct jobs or one compound role.
SEPARATE (2+ different jobs — results will be interleaved):
- ბუღალტერი მოლარე → qMode "separate", qBranches ["ბუღალტერი","მოლარე"]
- კონსულტანტი მენეჯერი → qMode "separate", qBranches ["კონსულტანტი","მენეჯერი"]
- driver cook → qMode "separate", qBranches ["მძღოლი","მზარეული"] (or EN titles)
COMBINED (one role / title phrase — single search):
- პროექტების მენეჯერი → qMode "combined", q "პროექტების მენეჯერი"
- გაყიდვების კონსულტანტი → qMode "combined", q "გაყიდვების კონსულტანტი"
- დამწყები ბუღალტერი → qMode "combined", q "ბუღალტერი", experience ["0-1 წელი"]
- frontend developer → qMode "combined", q "frontend"
For separate: set q to the branches joined by space, qAlternates null/omit.
For combined: omit qBranches.

LATIN-TYPED GEORGIAN (critical):
Users often type Georgian words with Latin letters. You MUST normalize them to correct literary Mkhedruli — real Georgian spelling, not letter-soup.
Examples of the TASK (apply the same judgment to ANY word, do not only memorize these):
- direktori → დირექტორი
- finansisti → ფინანსისტი
- programisti → პროგრამისტი
- buhalteri → ბუღალტერი
- gayidvebi → გაყიდვები
- tbilisi → თბილისი
Wrong: დირექთორი, ფინანსისთი (never invent თ where the word uses ტ, or the reverse).
q MUST be the correct Mkhedruli form. qAlternates MUST include the user's original Latin spelling.

USER MESSAGE:
${raw.slice(0, 1200)}
${enriched.changed ? `\nPhonetic hint (may be wrong on ტ/თ — prefer real Georgian): ${planned.slice(0, 400)}` : ""}

CATEGORIES (id:name) — sectors only:
${categoriesPromptList()}

Cities: ${CITIES.join(", ")}
Experience: ${EXPERIENCE_LABELS.join(", ")}

Return JSON:
- noResults: true when the query is nonsense (see above); otherwise omit or false
- queryType: "company" | "role" | "sector" | "other"
- qMode: "separate" | "combined" (roles only)
- qBranches: string[] when qMode is separate (2–4 distinct role keywords)
- categoryId, categoryName (sector browse only; null for roles/skills/companies)
- relatedCategoryId, relatedCategoryName: for ROLE titles only (e.g. ბუღალტერი → 20). Null for company searches.
- q: primary short keyword
- qAlternates: for ROLE combined — bilingual synonyms; for COMPANY — name spellings only
- city, salaryMin, salaryMax, hasSalary, workingMode, experience, employmentType
- uploadedSince: "today" when user wants jobs uploaded/posted today (დღევანდელი, დღეს ატვირთული, today)
- preferRoleFamilies: optional for roles only, e.g. ["software_dev"]
- interpretation: short Georgian

CRITICAL:
- COMPANY: queryType "company"; no sector; no role synonyms.
- Role titles: categoryId null, but SET relatedCategoryId when a sector exists (combined only).
- COMBINED roles: ALWAYS bilingual qAlternates (correct KA + Latin typing + EN).
- SEPARATE: qBranches required; do not OR-merge roles into qAlternates.
- Sector browse ONLY for exact sector names → categoryId, q "".
- City-only → city, q "".
- TODAY / დღევანდელი: uploadedSince "today"; q MUST NOT be "დღევანდელი" (that is not a job keyword). If only asking for today's jobs → q "".
- დღიური means day-wage labor, NOT uploaded today — do not set uploadedSince for დღიური.
- დამწყები/junior → experience "0-1 წელი" (or სტაჟირება when they ask for internship); keep q as the role only.
- Never put salary numbers or "ლარიდან"/"ზევით" into q or qAlternates.

Output JSON only.`;

  try {
    let text: string | null = null;
    for (const model of geminiModelCandidates()) {
      const result = await callGeminiPlanner(apiKey, model, prompt);
      if (result.ok) {
        text = result.text;
        break;
      }
      // Quota / timeout → try next model; other errors stop.
      if (result.status !== 429 && result.status !== 408 && result.status !== 404) {
        break;
      }
    }
    if (!text) {
      // Do NOT cache failures — use literal local plan (no invented role synonyms).
      return finalizePlan(local, raw);
    }

    const parsed = extractJsonObject(text) as Partial<SmartJobFilters> & {
      interpretation?: string;
      categoryId?: number | null;
      categoryName?: string | null;
      hasSalary?: boolean | null;
      noResults?: boolean | null;
      qMode?: string | null;
      qBranches?: string[] | null;
      queryType?: string | null;
    };

    if (parsed.noResults === true) {
      // Short latin may be a brand (tbc) — try literal company search before giving up.
      if (shortLatinBrand) {
        const brand = literalCompanyPlan(raw);
        cachePlanCluster(rawKey, brand);
        return brand;
      }
      const empty = emptySearchResult(true);
      cacheSet(rawKey, empty);
      return empty;
    }

    const altsPreview = Array.isArray(parsed.qAlternates)
      ? parsed.qAlternates.map((s) => String(s || "").trim())
      : [];
    const companyNoise = altsPreview.some((a) =>
      /^(it|აითი|აიტი|developer|software(\s+developer)?|პროგრამისტი|programmer|engineer)$/i.test(
        a,
      ),
    );
    // epam + IT synonyms / IT category → force company clamp even if model forgets queryType
    const pollutedCompanyPlan =
      /^[a-z][a-z0-9.&-]{2,24}$/i.test(raw) &&
      !isSkillKeywordQuery(raw) &&
      (companyNoise ||
        (parsed.relatedCategoryId != null &&
          altsPreview.some((a) => a.toLowerCase() === raw.toLowerCase())));

    const isCompanyQuery =
      String(parsed.queryType || "").toLowerCase() === "company" ||
      String(parsed.intentId || "").toLowerCase() === "company" ||
      pollutedCompanyPlan;

    // Prefer explicit separate branches; ignore branches when model says combined.
    const separateBranches =
      isCompanyQuery ||
      String(parsed.qMode || "").toLowerCase() === "combined"
        ? undefined
        : parseQBranches(parsed.qBranches);

    // Skills / dedicated intents: keep keyword expansions, but take Gemini's city/salary.
    if (
      !separateBranches &&
      (matchIntent(raw) ||
        matchIntent(planned) ||
        isSkillKeywordQuery(raw) ||
        isSkillKeywordQuery(String(parsed.q || "")))
    ) {
      const intentPlanned =
        intentResult(raw) || intentResult(planned) || skillKeywordResult(raw);
      const extras = normalizeFilters(
        {
          q: parsed.q,
          qAlternates: parsed.qAlternates,
          categoryId: parsed.categoryId ?? undefined,
          categoryName: parsed.categoryName ?? undefined,
          relatedCategoryId: parsed.relatedCategoryId,
          relatedCategoryName: parsed.relatedCategoryName,
          city: parsed.city,
          salaryMin: parsed.salaryMin,
          salaryMax: parsed.salaryMax,
          hasSalary: parsed.hasSalary ?? undefined,
          workingMode: parsed.workingMode,
          experience: parsed.experience,
          employmentType: parsed.employmentType,
          preferRoleFamilies: parsed.preferRoleFamilies,
          preferSkills: parsed.preferSkills,
          preferPayCadence: parsed.preferPayCadence,
          intentId: parsed.intentId,
        },
        raw,
      );
      const geminiAlts = Array.isArray(parsed.qAlternates)
        ? parsed.qAlternates.map((s) => String(s || "").trim()).filter(Boolean)
        : [];
      const mergedAlts = [
        ...new Set([...(intentPlanned.filters.qAlternates || []), ...geminiAlts]),
      ].slice(0, 6);
      const plannedOut = finalizePlan(
        mergeLocalFacets(
          {
            filters: {
              ...intentPlanned.filters,
              qAlternates: mergedAlts.length
                ? mergedAlts
                : intentPlanned.filters.qAlternates?.slice(0, 6),
              city: extras.city,
              salaryMin: extras.salaryMin,
              salaryMax: extras.salaryMax,
              hasSalary: extras.hasSalary,
              workingMode: extras.workingMode,
              experience: extras.experience,
              employmentType: extras.employmentType,
              preferRoleFamilies:
                extras.preferRoleFamilies ||
                intentPlanned.filters.preferRoleFamilies,
            },
            interpretation:
              String(parsed.interpretation || "").trim() ||
              intentPlanned.interpretation,
            fromGemini: true,
          },
          planned,
        ),
        raw,
      );
      cachePlanCluster(rawKey, plannedOut);
      return plannedOut;
    }

    // Category browse ONLY when the user clearly named a sector — never for role titles.
    const localCategory =
      matchCategoryFromQuery(planned) || matchCategoryFromQuery(raw);
    const geminiCategory = resolveCategory(parsed);
    let extras = sanitizeSalaryOnlyQuery(
      normalizeFilters(
        {
          q: separateBranches ? separateBranches.join(" ") : parsed.q,
          qAlternates: separateBranches ? undefined : parsed.qAlternates,
          qBranches: separateBranches,
          categoryId: parsed.categoryId ?? undefined,
          categoryName: parsed.categoryName ?? undefined,
          relatedCategoryId: parsed.relatedCategoryId,
          relatedCategoryName: parsed.relatedCategoryName,
          city: parsed.city,
          salaryMin: parsed.salaryMin,
          salaryMax: parsed.salaryMax,
          hasSalary: parsed.hasSalary ?? undefined,
          workingMode: parsed.workingMode,
          experience: parsed.experience,
          employmentType: parsed.employmentType,
          preferRoleFamilies: parsed.preferRoleFamilies,
          preferSkills: parsed.preferSkills,
          preferPayCadence: parsed.preferPayCadence,
          intentId: parsed.intentId,
        },
        planned,
      ),
    );

    if (
      !separateBranches &&
      localCategory &&
      (!extras.q || matchCategoryFromQuery(String(extras.q || "")))
    ) {
      const plannedOut = mergeLocalFacets(
        categoryOnlyResult(localCategory, extras, true),
        planned,
      );
      cachePlanCluster(rawKey, plannedOut);
      return plannedOut;
    }

    // Gemini sometimes dumps role titles into a sector category — reject that.
    // Keep keyword search; synonyms must come from Gemini qAlternates, not a lexicon.
    if (geminiCategory && !localCategory && !separateBranches) {
      extras = {
        ...extras,
        categoryId: undefined,
        categoryName: undefined,
        q:
          extras.q ||
          planned
            .split(/\s+/)
            .find((t) => t.length > 2 && !isCityToken(t)) ||
          planned,
      };
    }

    if (separateBranches) {
      extras = {
        ...extras,
        q: separateBranches.join(" "),
        qBranches: separateBranches,
        qAlternates: undefined,
        categoryId: undefined,
        categoryName: undefined,
        relatedCategoryId: undefined,
        relatedCategoryName: undefined,
      };
    }

    if (isCompanyQuery) {
      extras = clampToCompanySearch(extras, raw);
    }

    if (extras.qAlternates?.length) {
      extras.qAlternates = extras.qAlternates.slice(0, 6);
    }

    const filters = extras;
    const interpretation =
      String(parsed.interpretation || "").trim() ||
      (filters.qBranches?.length
        ? filters.qBranches.join(" · ")
        : filters.categoryName || filters.q || planned);

    const plannedOut = isCompanyQuery
      ? mergeLocalFacets(
          {
            filters,
            interpretation,
            fromGemini: true,
          },
          planned,
        )
      : finalizePlan(
          mergeLocalFacets(
            {
              filters,
              interpretation,
              fromGemini: true,
            },
            planned,
          ),
          raw,
        );
    cachePlanCluster(rawKey, plannedOut);
    return plannedOut;
  } catch (error) {
    console.error("[smart-query]", error);
    return finalizePlan(local, raw);
  }
}

/** Serialize filters into URLSearchParams (without pagination). */
export function filtersToSearchParams(
  filters: SmartJobFilters,
  target = new URLSearchParams(),
): URLSearchParams {
  if (filters.q) target.set("q", filters.q);
  else target.set("q", "");
  if (filters.qAlternates?.length) {
    target.set("q_alt", filters.qAlternates.join("|"));
  }
  if (filters.qBranches?.length) {
    target.set("q_branches", filters.qBranches.join("|"));
  }
  if (filters.categoryId != null) {
    target.set("category_id", String(filters.categoryId));
  }
  if (filters.categoryName) {
    target.set("category_name", filters.categoryName);
  }
  if (filters.relatedCategoryId != null) {
    target.set("related_category_id", String(filters.relatedCategoryId));
  }
  if (filters.relatedCategoryName) {
    target.set("related_category_name", filters.relatedCategoryName);
  }
  if (filters.city) target.set("city", filters.city);
  if (filters.salaryMin != null) {
    target.set("salary_min", String(filters.salaryMin));
  }
  if (filters.salaryMax != null) {
    target.set("salary_max", String(filters.salaryMax));
  }
  if (filters.hasSalary) target.set("has_salary", "1");
  if (filters.workingMode) {
    target.set("working_mode", filters.workingMode);
  }
  if (filters.experience?.length) {
    target.set("experience", filters.experience.join(","));
  }
  if (filters.employmentType) {
    target.set("employment_type", filters.employmentType);
  }
  if (filters.preferRoleFamilies?.length) {
    target.set("prefer_roles", filters.preferRoleFamilies.join(","));
  }
  if (filters.preferSkills?.length) {
    target.set("prefer_skills", filters.preferSkills.join(","));
  }
  if (filters.preferPayCadence?.length) {
    target.set("prefer_pay", filters.preferPayCadence.join(","));
  }
  if (filters.intentId) target.set("intent_id", filters.intentId);
  if (filters.uploadedSince === "today") {
    target.set("uploaded_since", "today");
  }
  if (filters.order) target.set("order", filters.order);
  return target;
}

/** Parse structured filters from request params (skip Gemini). */
export function filtersFromSearchParams(
  params: URLSearchParams,
): SmartJobFilters {
  const experienceRaw = params.get("experience") || "";
  const workingModeRaw = (params.get("working_mode") || "").toLowerCase();
  const qAlt = params.get("q_alt") || "";
  const qBranchesRaw = params.get("q_branches") || "";
  const categoryIdRaw = params.get("category_id");

  return normalizeFilters(
    {
      q: params.get("q") || "",
      qAlternates: qAlt
        ? qAlt.split("|").map((s) => s.trim()).filter(Boolean)
        : undefined,
      qBranches: qBranchesRaw
        ? qBranchesRaw.split("|").map((s) => s.trim()).filter(Boolean)
        : undefined,
      categoryId: categoryIdRaw ? Number(categoryIdRaw) : undefined,
      categoryName: params.get("category_name") || undefined,
      relatedCategoryId: params.get("related_category_id")
        ? Number(params.get("related_category_id"))
        : undefined,
      relatedCategoryName: params.get("related_category_name") || undefined,
      city: params.get("city") || undefined,
      salaryMin: params.get("salary_min")
        ? Number(params.get("salary_min"))
        : undefined,
      salaryMax: params.get("salary_max")
        ? Number(params.get("salary_max"))
        : undefined,
      hasSalary:
        params.get("has_salary") === "1" ||
        params.get("has_salary") === "true" ||
        undefined,
      workingMode:
        workingModeRaw === "remote" || workingModeRaw === "onsite"
          ? workingModeRaw
          : undefined,
      experience: experienceRaw
        ? experienceRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      employmentType: params.get("employment_type") || undefined,
      preferRoleFamilies: (params.get("prefer_roles") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      preferSkills: (params.get("prefer_skills") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      preferPayCadence: (params.get("prefer_pay") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as PayCadence[],
      intentId: params.get("intent_id") || undefined,
      uploadedSince:
        params.get("uploaded_since") === "today" ? "today" : undefined,
      order: "newest",
    },
    params.get("q") || "",
  );
}
