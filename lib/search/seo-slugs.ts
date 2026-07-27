/**
 * Edge-safe slug helpers for /search/[slug] (usable from middleware).
 */

import {
  reverseTransliterateToken,
  transliterateToken,
} from "@/lib/search/ka-latin"

export type SeoKeyword = {
  /** URL segment, e.g. "farmaccevti" */
  slug: string
  /** Display / search query (usually Georgian) */
  query: string
}

/** High-intent competitive roles / phrases for Georgia job search. */
export const SEED_KEYWORDS: SeoKeyword[] = [
  { slug: "farmaccevti", query: "ფარმაცევტი" },
  { slug: "bughalteri", query: "ბუღალტერი" },
  { slug: "bughalteria", query: "ბუღალტერია" },
  { slug: "mdzgholi", query: "მძღოლი" },
  { slug: "developeri", query: "დეველოპერი" },
  { slug: "frontend-developer", query: "frontend developer" },
  { slug: "backend-developer", query: "backend developer" },
  { slug: "react-developer", query: "react" },
  { slug: "gaqidvebis-menedjeri", query: "გაყიდვების მენეჯერი" },
  { slug: "marketingis-menedjeri", query: "მარკეტინგის მენეჯერი" },
  { slug: "hr-menedjeri", query: "HR მენეჯერი" },
  { slug: "dizaineri", query: "დიზაინერი" },
  { slug: "grafikuli-dizaineri", query: "გრაფიკული დიზაინერი" },
  { slug: "dgiuri", query: "დღიური" },
  { slug: "distanciuri", query: "დისტანციური" },
  { slug: "mzareuli", query: "მზარეული" },
  { slug: "mimtani", query: "მიმტანი" },
  { slug: "molare-konsultanti", query: "მოლარე-კონსულტანტი" },
  { slug: "administratori", query: "ადმინისტრატორი" },
  { slug: "ektani", query: "ექთანი" },
  { slug: "ekimi", query: "ექიმი" },
  { slug: "iuristi", query: "იურისტი" },
  { slug: "programisti", query: "პროგრამისტი" },
  { slug: "inzhineri", query: "ინჟინერი" },
  { slug: "lojistika", query: "ლოჯისტიკა" },
  { slug: "musha", query: "მუშა" },
  { slug: "dasuftaveba", query: "დასუფთავება" },
  { slug: "datsva", query: "დაცვა" },
  { slug: "call-center", query: "ქოლ ცენტრი" },
  { slug: "ofisi-menedjeri", query: "ოფის მენეჯერი" },
  { slug: "produktis-menedjeri", query: "პროდუქტის მენეჯერი" },
  { slug: "qa-engineer", query: "QA" },
  { slug: "devops", query: "DevOps" },
  { slug: "junior-developer", query: "junior developer" },
  { slug: "senior-developer", query: "senior developer" },
  { slug: "tbilisi-vakansiebi", query: "თბილისი" },
  { slug: "batumi-vakansiebi", query: "ბათუმი" },
  { slug: "khelfasiani", query: "ხელფასიანი" },
  { slug: "2000-laridan", query: "2000 ლარიდან" },
  { slug: "dgevandeli-vakansiebi", query: "დღევანდელი ვაკანსიები" },
]

const SEED_BY_SLUG = new Map(SEED_KEYWORDS.map((k) => [k.slug, k]))
const SEED_BY_QUERY = new Map(
  SEED_KEYWORDS.map((k) => [k.query.trim().toLowerCase(), k]),
)

/** Latin URL slug from a free-text query. */
export function slugifyQuery(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ")
  if (!trimmed) return "search"

  const seed = SEED_BY_QUERY.get(trimmed.toLowerCase())
  if (seed) return seed.slug

  const latin = trimmed
    .split(/\s+/)
    .map((tok) => {
      if (/^[\u10A0-\u10FF]+$/u.test(tok)) return reverseTransliterateToken(tok)
      return tok
    })
    .join(" ")

  const slug = latin
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)

  return slug || "search"
}

/** Canonical path for a search landing (no query string). */
export function searchPath(query: string, page = 1): string {
  const slug = slugifyQuery(query)
  const base = `/search/${encodeURIComponent(slug)}`
  return page > 1 ? `${base}?page=${page}` : base
}

/**
 * Resolve a URL slug (+ optional ?q= override) back to the search query.
 */
export function resolveSearchQuery(
  slug: string,
  qOverride?: string | null,
): string {
  const override = String(qOverride || "").trim()
  if (override) return override

  const decoded = decodeURIComponent(slug || "").trim()
  const seed = SEED_BY_SLUG.get(decoded)
  if (seed) return seed.query

  const parts = decoded.split("-").filter(Boolean)
  if (!parts.length) return decoded

  return parts
    .map((part) => {
      const lower = part.toLowerCase()
      if (
        /^(frontend|backend|developer|react|node|devops|junior|senior|qa|hr|call|center|office|manager|remote)$/i.test(
          lower,
        )
      ) {
        return part
      }
      if (/^[a-z0-9]+$/i.test(part)) {
        const ka = transliterateToken(part)
        return /[\u10A0-\u10FF]/.test(ka) ? ka : part
      }
      return part
    })
    .join(" ")
}

export function getSeedKeywords(): SeoKeyword[] {
  return SEED_KEYWORDS.slice()
}

/** Top keywords for crawlable home / footer links. */
export function getHomeKeywordLinks(count = 16): SeoKeyword[] {
  return SEED_KEYWORDS.slice(0, count)
}
