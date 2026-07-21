import { getSamushaoApiBaseUrl } from "@/lib/scrape-jobs"
import { SAMUSHAO_CATEGORIES } from "@/lib/samushao-filters"

export type CategoryCount = {
  category_id: number
  name: string
  count: number
}

export type CategoryCountsPayload = {
  total: number
  updated_at: string | null
  categories: CategoryCount[]
}

/** GET /api/scraped-jobs/categories */
export async function fetchCategoryCounts(): Promise<CategoryCountsPayload> {
  const base = getSamushaoApiBaseUrl()
  const res = await fetch(`${base}/api/scraped-jobs/categories`, {
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`category counts failed: ${res.status}`)
  }
  const data = (await res.json()) as {
    ok?: boolean
    total?: number
    updated_at?: string | null
    categories?: CategoryCount[]
  }
  const categories = Array.isArray(data.categories) ? data.categories : []
  return {
    total: Number(data.total) || categories.reduce((s, c) => s + (c.count || 0), 0),
    updated_at: data.updated_at ?? null,
    categories,
  }
}

/** Fallback list when the scraped categories API is unreachable. */
export function fallbackCategoryCounts(): CategoryCountsPayload {
  return {
    total: 0,
    updated_at: null,
    categories: SAMUSHAO_CATEGORIES.map((name, i) => ({
      category_id: i + 1,
      name,
      count: 0,
    })),
  }
}

export function categoryNameMapFromCounts(
  categories: CategoryCount[]
): Map<number, string> {
  return new Map(categories.map((c) => [c.category_id, c.name]))
}
