/**
 * Indexable keyword collection for sitemaps (Node runtime).
 */

import { fetchPopularQueries } from "@/lib/search/popular-queries"
import {
  SEED_KEYWORDS,
  slugifyQuery,
  type SeoKeyword,
} from "@/lib/search/seo-slugs"

export type { SeoKeyword }
export {
  SEED_KEYWORDS,
  slugifyQuery,
  searchPath,
  resolveSearchQuery,
  getSeedKeywords,
  getHomeKeywordLinks,
} from "@/lib/search/seo-slugs"

const MAX_SITEMAP_KEYWORDS = 400

/** Seed + popular searches, de-duped by slug, capped for sitemap quality. */
export async function collectIndexableKeywords(
  limit = MAX_SITEMAP_KEYWORDS,
): Promise<SeoKeyword[]> {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_SITEMAP_KEYWORDS)
  const bySlug = new Map<string, SeoKeyword>()

  for (const k of SEED_KEYWORDS) {
    bySlug.set(k.slug, k)
  }

  try {
    const popular = await fetchPopularQueries(Math.min(safeLimit, 100))
    for (const query of popular) {
      const q = query.trim()
      if (!q || q.length < 2 || q.length > 80) continue
      if (/^(ვაკანსიები|სამუშაო|jobs?|test|asdf)$/i.test(q)) continue
      const slug = slugifyQuery(q)
      if (!slug || bySlug.has(slug)) continue
      bySlug.set(slug, { slug, query: q })
      if (bySlug.size >= safeLimit) break
    }
  } catch {
    // Seed-only is fine if popular upstream is down.
  }

  return Array.from(bySlug.values()).slice(0, safeLimit)
}
