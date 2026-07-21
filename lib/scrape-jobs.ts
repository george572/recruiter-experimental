import type { Job, JobSource, JobType, Level, Workplace } from "@/lib/jobs"
import { JOB_SOURCES } from "@/lib/jobs"
import { normalizeCategoryName } from "@/lib/samushao-filters"

/** Raw row from Samushao GET /api/scraped-jobs */
export type ScrapedJobRow = {
  id: string
  source: string
  source_host: string
  external_id: string
  title: string | null
  company: string | null
  business_name: string | null
  description_html: string | null
  salary_text: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  city: string | null
  address: string | null
  employment_type: string | null
  working_type: string | null
  sphere: string | null
  company_logo_url: string | null
  source_url: string | null
  apply_url?: string | null
  category_id?: number | null
  click_count?: number | null
  scraped_at: string | null
  updated_at?: string | null
  created_at?: string | null
}

export type ScrapedSourceCount = {
  source: string
  host: string
  count: number
  available?: boolean
}

export type ScrapedFilterOption = {
  name: string
  count: number
}

export type ScrapedFiltersPayload = {
  sources: ScrapedSourceCount[]
  cities: ScrapedFilterOption[]
  employment_types: ScrapedFilterOption[]
  categories: { category_id: number; name: string; count: number }[]
  total_jobs: number
}

export const SOURCE_KEY_TO_JOB_SOURCE: Record<string, JobSource> = {
  jobs_ge: "jobs.ge",
  hr_ge: "hr.ge",
  awork: "awork.ge",
  unijobs: "unijobs.ge",
  myjobs: "myjobs.ge",
  vdk: "v.dk.ge",
  teacherjobs: "teacherjobs.ge",
  jobs_ss_ge: "jobs.ss.ge",
  joob: "joob.ge",
}

export const JOB_SOURCE_TO_API: Partial<Record<JobSource, string>> = {
  "jobs.ge": "jobs_ge",
  "hr.ge": "hr_ge",
  "awork.ge": "awork",
  "unijobs.ge": "unijobs",
  "myjobs.ge": "myjobs",
  "v.dk.ge": "vdk",
  "teacherjobs.ge": "teacherjobs",
  "jobs.ss.ge": "jobs_ss_ge",
  "joob.ge": "joob",
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
      const code = Number.parseInt(hex, 16)
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return ""
      try {
        return String.fromCodePoint(code)
      } catch {
        return ""
      }
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10)
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return ""
      try {
        return String.fromCodePoint(code)
      } catch {
        return ""
      }
    })
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return ""
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim()
}

function mapWorkplace(value: string | null | undefined): Workplace {
  const v = (value || "").toLowerCase()
  if (/remote|დისტანც|home|მოგზაურ/.test(v)) return "Remote"
  if (/hybrid|ჰიბრიდ/.test(v)) return "Hybrid"
  return "On-site"
}

function mapJobType(value: string | null | undefined): JobType {
  const v = (value || "").toLowerCase()
  if (/part|ნახევარ|part-time/.test(v)) return "Part-time"
  if (/intern|სტაჟ|internship/.test(v)) return "Internship"
  if (/contract|კონტრაქტ|freelance|თავისუფალ/.test(v)) return "Contract"
  return "Full-time"
}

function mapLevel(value: string | null | undefined, title: string): Level {
  const hay = `${value || ""} ${title}`.toLowerCase()
  if (/lead|ლიდ|head|უფროსი/.test(hay)) return "Lead"
  if (/senior|სენიორ|sr\b/.test(hay)) return "Senior"
  if (/junior|ჯუნიორ|jr\b|entry|დამწყებ/.test(hay)) return "Junior"
  return "Mid"
}

function daysAgoFrom(iso: string | null | undefined): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return 0
  const diff = Date.now() - t
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function faviconFor(host: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`
}

function resolveJobSource(row: ScrapedJobRow): JobSource {
  return SOURCE_KEY_TO_JOB_SOURCE[row.source] || "samushao.ge"
}

export function getSamushaoApiBaseUrl() {
  return (
    process.env.SAMUSHAO_API_BASE ||
    process.env.NEXT_PUBLIC_SAMUSHAO_API_BASE ||
    "https://samushao.ge"
  ).replace(/\/$/, "")
}

export type CategoryNameMap = Map<number, string>

export function mapScrapedJobToJob(
  row: ScrapedJobRow,
  categoryNames?: CategoryNameMap
): Job {
  const source = resolveJobSource(row)
  const host = row.source_host || source
  const title = (row.title || "ვაკანსია").trim()
  const company = (row.company || row.business_name || "კომპანია").trim()
  const location = (row.city || row.address || "საქართველო").trim()
  const description =
    stripHtml(row.description_html) ||
    row.salary_text ||
    `${title} — ${company}`
  const logo =
    (row.company_logo_url && row.company_logo_url.trim()) ||
    JOB_SOURCES.find((s) => s.id === source)?.logo ||
    faviconFor(host)

  const salaryMin = Math.round(Number(row.salary_min) || 0)
  const salaryMax = Math.round(Number(row.salary_max) || salaryMin || 0)
  const rawCurrency = (row.salary_currency || "₾").trim() || "₾"
  const currency =
    rawCurrency.toUpperCase() === "GEL" || rawCurrency.toUpperCase() === "GEL."
      ? "₾"
      : rawCurrency
  const tags = [row.sphere, row.employment_type, row.working_type]
    .filter((t): t is string => Boolean(t && String(t).trim()))
    .map((t) => String(t).trim())
    .slice(0, 6)

  const categoryId =
    row.category_id != null && Number.isFinite(Number(row.category_id))
      ? Number(row.category_id)
      : null
  const categoryFromId =
    categoryId != null ? categoryNames?.get(categoryId) : undefined

  return {
    id: row.id,
    title,
    company,
    logo,
    location,
    workplace: mapWorkplace(row.working_type),
    type: mapJobType(row.employment_type),
    level: mapLevel(row.sphere, title),
    category: categoryFromId || normalizeCategoryName(row.sphere),
    categoryId,
    source,
    salaryMin,
    salaryMax: salaryMax || salaryMin,
    currency,
    postedDaysAgo: daysAgoFrom(row.scraped_at || row.created_at),
    description,
    tags,
    applicants: Number(row.click_count) || 0,
    sourceUrl: row.source_url || null,
    applyUrl: row.apply_url || row.source_url || null,
    clickCount: Number(row.click_count) || 0,
  }
}

export type ScrapedJobsQuery = {
  source?: string
  q?: string
  limit?: number
  offset?: number
  categoryId?: number
  city?: string
  employmentType?: string
  salaryMin?: number
  salaryMax?: number
  order?: "round_robin" | "newest"
}

export type ScrapedJobsPage = {
  jobs: Job[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
  nextOffset: number | null
}

function buildJobsParams(options: ScrapedJobsQuery = {}) {
  const limit = options.limit ?? 50
  const offset = options.offset ?? 0
  const params = new URLSearchParams()
  params.set("limit", String(limit))
  params.set("offset", String(offset))
  params.set("order", options.order || "round_robin")
  if (options.source) params.set("source", options.source)
  if (options.q) params.set("q", options.q)
  if (options.categoryId != null && Number.isFinite(options.categoryId)) {
    params.set("category_id", String(options.categoryId))
  }
  if (options.city) params.set("city", options.city)
  if (options.employmentType) params.set("employment_type", options.employmentType)
  if (options.salaryMin != null && options.salaryMin > 0) {
    params.set("salary_min", String(options.salaryMin))
  }
  if (options.salaryMax != null) {
    params.set("salary_max", String(options.salaryMax))
  }
  return params
}

export async function fetchScrapedJobs(
  options: ScrapedJobsQuery = {},
  categoryNames?: CategoryNameMap
): Promise<ScrapedJobsPage> {
  const base = getSamushaoApiBaseUrl()
  const params = buildJobsParams(options)

  const res = await fetch(`${base}/api/scraped-jobs?${params}`, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`scraped-jobs failed: ${res.status}`)
  }
  const data = (await res.json()) as {
    jobs?: ScrapedJobRow[]
    total?: number
    limit?: number
    offset?: number
    has_more?: boolean
    hasMore?: boolean
    next_offset?: number | null
  }
  const jobs = (data.jobs || [])
    .map((row) => {
      try {
        return mapScrapedJobToJob(row, categoryNames)
      } catch (err) {
        console.error("[scrape-jobs] map failed for", row?.id, err)
        return null
      }
    })
    .filter((job): job is Job => job != null)
  const total = Number(data.total) || jobs.length
  const resolvedOffset = Number(data.offset) || options.offset || 0
  const resolvedLimit = Number(data.limit) || options.limit || 50
  const hasMore =
    typeof data.has_more === "boolean"
      ? data.has_more
      : typeof data.hasMore === "boolean"
        ? data.hasMore
        : resolvedOffset + jobs.length < total
  const nextOffset =
    data.next_offset != null
      ? Number(data.next_offset)
      : hasMore
        ? resolvedOffset + jobs.length
        : null

  return {
    jobs,
    total,
    limit: resolvedLimit,
    offset: resolvedOffset,
    hasMore,
    nextOffset,
  }
}

export async function fetchScrapedJobById(
  id: string,
  categoryNames?: CategoryNameMap
): Promise<Job | null> {
  const base = getSamushaoApiBaseUrl()
  const res = await fetch(`${base}/api/scraped-jobs/${encodeURIComponent(id)}`, {
    cache: "no-store",
  })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`scraped-job failed: ${res.status}`)
  }
  const data = (await res.json()) as { job?: ScrapedJobRow }
  if (!data.job) return null
  return mapScrapedJobToJob(data.job, categoryNames)
}

export async function fetchScrapedSources(): Promise<ScrapedSourceCount[]> {
  const base = getSamushaoApiBaseUrl()
  const res = await fetch(`${base}/api/scraped-jobs/sources`, { cache: "no-store" })
  if (!res.ok) throw new Error(`scraped sources failed: ${res.status}`)
  const data = (await res.json()) as { sources?: ScrapedSourceCount[] }
  return data.sources || []
}

export async function fetchScrapedFilters(): Promise<ScrapedFiltersPayload> {
  const base = getSamushaoApiBaseUrl()
  const res = await fetch(`${base}/api/scraped-jobs/filters`, { cache: "no-store" })
  if (!res.ok) throw new Error(`scraped filters failed: ${res.status}`)
  const data = (await res.json()) as Partial<ScrapedFiltersPayload> & { ok?: boolean }
  return {
    sources: data.sources || [],
    cities: data.cities || [],
    employment_types: data.employment_types || [],
    categories: data.categories || [],
    total_jobs: Number(data.total_jobs) || 0,
  }
}

export async function recordScrapedJobClick(id: string): Promise<{
  click_count: number
  source_url: string | null
}> {
  const base = getSamushaoApiBaseUrl()
  const res = await fetch(`${base}/api/scraped-jobs/${encodeURIComponent(id)}/click`, {
    method: "POST",
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`scraped click failed: ${res.status}`)
  }
  const data = (await res.json()) as {
    click_count?: number
    source_url?: string | null
  }
  return {
    click_count: Number(data.click_count) || 0,
    source_url: data.source_url ?? null,
  }
}
