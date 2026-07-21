import type { Job } from "@/lib/jobs"
import { formatJobSalary } from "@/lib/jobs"

/**
 * Central SEO configuration and structured-data helpers.
 * Non-visual: everything here feeds <head> metadata, JSON-LD, sitemap and robots.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://recruiter.ge"
).replace(/\/$/, "")

export const SITE_NAME = "Recruiter.ge"
export const SITE_LOCALE = "ka_GE"
export const SITE_COUNTRY = "საქართველო"

export const SITE_TAGLINE = "ვაკანსიები საქართველოში"

export const DEFAULT_TITLE = `${SITE_TAGLINE} — ${SITE_NAME}`

export const DEFAULT_DESCRIPTION =
  "იპოვე შენი მომდევნო სამუშაო Recruiter.ge-ზე — საქართველოს წამყვანი საიტების ვაკანსიები ერთ ადგილას. მოძებნე პოზიციები კატეგორიის, ქალაქისა და ხელფასის მიხედვით და გააგზავნე განაცხადი პირდაპირ დამსაქმებელთან."

export const SITE_KEYWORDS = [
  "ვაკანსიები",
  "ვაკანსია",
  "სამუშაო",
  "სამუშაო ადგილები",
  "დასაქმება",
  "ვაკანსიები თბილისში",
  "ვაკანსიები საქართველოში",
  "სამუშაოს ძებნა",
  "recruiter.ge",
  "jobs.ge",
  "hr.ge",
]

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/** Canonical URL for a single job detail page. */
export function jobPath(id: string): string {
  return `/jobs/${encodeURIComponent(id)}`
}

/** Collapse whitespace and trim a plain-text string. */
function normalizeText(input: string | null | undefined): string {
  return (input || "").replace(/\s+/g, " ").trim()
}

/**
 * Produce a clean meta description: collapse whitespace and truncate on a word
 * boundary to keep it within the recommended ~160 character window.
 */
export function toMetaDescription(
  input: string | null | undefined,
  max = 160
): string {
  const text = normalizeText(input)
  if (text.length <= max) return text
  const clipped = text.slice(0, max - 1)
  const lastSpace = clipped.lastIndexOf(" ")
  return `${(lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).trim()}…`
}

/** Map internal job type to a schema.org employmentType enum value. */
function schemaEmploymentType(type: Job["type"]): string {
  switch (type) {
    case "Part-time":
      return "PART_TIME"
    case "Contract":
      return "CONTRACTOR"
    case "Internship":
      return "INTERN"
    default:
      return "FULL_TIME"
  }
}

/** Map a currency symbol/code to an ISO 4217 currency code. */
function isoCurrency(currency: string | null | undefined): string {
  const c = normalizeText(currency).toUpperCase()
  if (!c) return "GEL"
  if (c === "₾" || c === "GEL" || c === "GEL.") return "GEL"
  if (c === "$" || c === "USD") return "USD"
  if (c === "€" || c === "EUR") return "EUR"
  if (c === "£" || c === "GBP") return "GBP"
  if (c === "₽" || c === "RUB") return "RUB"
  return c.replace(/[^A-Z]/g, "") || "GEL"
}

const DAY_MS = 1000 * 60 * 60 * 24
const EXPIRY_WINDOW_DAYS = 30

/** Date (YYYY-MM-DD) a job was posted, derived from postedDaysAgo. */
function datePosted(job: Job, nowMs = Date.now()): string {
  const ms = nowMs - Math.max(0, job.postedDaysAgo) * DAY_MS
  return new Date(ms).toISOString().slice(0, 10)
}

/** Expiry timestamp (posted + 30 days), matching the detail page window. */
function validThrough(job: Job, nowMs = Date.now()): string {
  const ms = nowMs - (job.postedDaysAgo - EXPIRY_WINDOW_DAYS) * DAY_MS
  return `${new Date(ms).toISOString().slice(0, 10)}T23:59:59`
}

/**
 * schema.org/JobPosting structured data for a single job.
 * https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export function buildJobPostingJsonLd(
  job: Job,
  nowMs = Date.now()
): Record<string, unknown> {
  const url = absoluteUrl(jobPath(job.id))
  const description =
    normalizeText(job.description) || `${job.title} — ${job.company}`

  const isRemote = job.workplace === "Remote"

  const data: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description,
    identifier: {
      "@type": "PropertyValue",
      name: SITE_NAME,
      value: String(job.id),
    },
    datePosted: datePosted(job, nowMs),
    validThrough: validThrough(job, nowMs),
    employmentType: schemaEmploymentType(job.type),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(job.logo ? { logo: job.logo } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location || SITE_COUNTRY,
        addressRegion: job.location || SITE_COUNTRY,
        addressCountry: "GE",
      },
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "Georgia",
    },
    url,
    directApply: false,
  }

  if (isRemote) {
    data.jobLocationType = "TELECOMMUTE"
  }

  const salaryMin = Number(job.salaryMin) || 0
  const salaryMax = Number(job.salaryMax) || 0
  if (salaryMin > 0 || salaryMax > 0) {
    const value: Record<string, unknown> = {
      "@type": "QuantitativeValue",
      unitText: "MONTH",
    }
    if (salaryMin > 0 && salaryMax > 0 && salaryMin !== salaryMax) {
      value.minValue = salaryMin
      value.maxValue = salaryMax
    } else {
      value.value = salaryMax || salaryMin
    }
    data.baseSalary = {
      "@type": "MonetaryAmount",
      currency: isoCurrency(job.currency),
      value,
    }
  }

  return data
}

/** schema.org/BreadcrumbList: Home → job title. */
export function buildJobBreadcrumbJsonLd(job: Job): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ვაკანსიები",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: job.title,
        item: absoluteUrl(jobPath(job.id)),
      },
    ],
  }
}

/** Generic schema.org/BreadcrumbList from an ordered list of crumbs. */
export function buildBreadcrumbJsonLd(
  crumbs: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}

/** schema.org/ItemList of job postings for a listing / landing page. */
export function buildItemListJsonLd(
  jobs: Job[],
  name?: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(name ? { name } : {}),
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(jobPath(job.id)),
      name: `${job.title} — ${job.company}`,
    })),
  }
}

/** schema.org/WebSite with a sitelinks search action for the home page. */
export function buildWebsiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Recruiter",
    url: absoluteUrl("/"),
    inLanguage: "ka",
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

/** schema.org/Organization describing the publisher. */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/favicon.png"),
    description: DEFAULT_DESCRIPTION,
  }
}

/** Human-readable salary line reused for share descriptions. */
export function jobShareDescription(job: Job): string {
  const salary = formatJobSalary(job)
  const bits = [job.company, job.location, salary].filter(Boolean)
  const lead = bits.join(" · ")
  const body = normalizeText(job.description)
  return toMetaDescription(lead && body ? `${lead}. ${body}` : lead || body)
}
