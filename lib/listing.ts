import {
  categoryNameMapFromCounts,
  fallbackCategoryCounts,
  fetchCategoryCounts,
  type CategoryCount,
} from "@/lib/category-counts"
import {
  fetchScrapedFilters,
  fetchScrapedJobs,
  fetchScrapedSources,
  type ScrapedFilterOption,
  type ScrapedSourceCount,
} from "@/lib/scrape-jobs"
import { JOBS, type Job } from "@/lib/jobs"

const PAGE_SIZE = 50

export type ListingData = {
  jobs: Job[]
  total: number
  hasMore: boolean
  nextOffset: number | null
  categories: CategoryCount[]
  sources: ScrapedSourceCount[]
  cities: ScrapedFilterOption[]
  /** Resolved category_id for the requested category name, if any. */
  categoryId: number | null
}

/**
 * Loads the data needed to render the job board (home + landing pages),
 * optionally scoped to a single category and/or city. Filtered requests never
 * fall back to unfiltered mock data, so a landing page only ever shows jobs that
 * actually match its category / city.
 */
export async function loadListingData(
  opts: { categoryName?: string; city?: string } = {}
): Promise<ListingData> {
  const isFiltered = Boolean(opts.categoryName || opts.city)

  let categories = fallbackCategoryCounts().categories
  let sources: ScrapedSourceCount[] = []
  let cities: ScrapedFilterOption[] = []

  const [categoriesResult, filtersResult, sourcesResult] =
    await Promise.allSettled([
      fetchCategoryCounts(),
      fetchScrapedFilters(),
      fetchScrapedSources(),
    ])

  if (categoriesResult.status === "fulfilled") {
    categories = categoriesResult.value.categories
  }
  if (filtersResult.status === "fulfilled") {
    cities = filtersResult.value.cities ?? []
    if (!categories.length) categories = filtersResult.value.categories ?? []
    if (!sources.length) sources = filtersResult.value.sources ?? []
  }
  if (sourcesResult.status === "fulfilled") {
    sources = sourcesResult.value
  }

  const categoryNames = categoryNameMapFromCounts(categories)
  const categoryId = opts.categoryName
    ? categories.find((c) => c.name === opts.categoryName)?.category_id ?? null
    : null

  let jobs = isFiltered ? [] : JOBS.slice(0, PAGE_SIZE)
  let total = isFiltered ? 0 : JOBS.length
  let hasMore = isFiltered ? false : JOBS.length > PAGE_SIZE
  let nextOffset: number | null = hasMore ? PAGE_SIZE : null

  try {
    const page = await fetchScrapedJobs(
      {
        limit: PAGE_SIZE,
        offset: 0,
        order: "newest",
        categoryId: categoryId ?? undefined,
        city: opts.city,
      },
      categoryNames
    )
    if (isFiltered || page.jobs.length > 0) {
      jobs = page.jobs
      total = page.total
      hasMore = page.hasMore
      nextOffset = page.nextOffset
    }
  } catch (err) {
    console.error("[listing] scraped jobs unavailable:", err)
  }

  return {
    jobs,
    total,
    hasMore,
    nextOffset,
    categories,
    sources,
    cities,
    categoryId,
  }
}
