import { AudienceOverview } from "@/components/audience-overview"
import {
  categoryNameMapFromCounts,
  fallbackCategoryCounts,
  fetchCategoryCounts,
} from "@/lib/category-counts"
import {
  fetchScrapedFilters,
  fetchScrapedJobs,
  fetchScrapedSources,
  type ScrapedFilterOption,
  type ScrapedSourceCount,
} from "@/lib/scrape-jobs"
import { JOBS } from "@/lib/jobs"
import type { Metadata } from "next"
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
  },
}

const INITIAL_PAGE_SIZE = 50

export default async function Page() {
  let jobs = JOBS.slice(0, INITIAL_PAGE_SIZE)
  let total = JOBS.length
  let hasMore = JOBS.length > INITIAL_PAGE_SIZE
  let nextOffset: number | null = hasMore ? INITIAL_PAGE_SIZE : null
  let categories = fallbackCategoryCounts().categories
  let sources: ScrapedSourceCount[] = []
  let cities: ScrapedFilterOption[] = []

  const [categoriesResult, filtersResult, sourcesResult] = await Promise.allSettled([
    fetchCategoryCounts(),
    fetchScrapedFilters(),
    fetchScrapedSources(),
  ])

  if (categoriesResult.status === "fulfilled") {
    categories = categoriesResult.value.categories
  } else {
    console.error("[page] category counts unavailable:", categoriesResult.reason)
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

  try {
    const page = await fetchScrapedJobs(
      { limit: INITIAL_PAGE_SIZE, offset: 0, order: "round_robin" },
      categoryNames
    )
    if (page.jobs.length > 0) {
      jobs = page.jobs
      total = page.total
      hasMore = page.hasMore
      nextOffset = page.nextOffset
    }
  } catch (err) {
    console.error("[page] scraped jobs unavailable, using mock:", err)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWebsiteJsonLd()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildOrganizationJsonLd()),
        }}
      />
      <AudienceOverview
        initialJobs={jobs}
        initialTotal={total}
        initialHasMore={hasMore}
        initialNextOffset={nextOffset}
        categories={categories}
        sources={sources}
        cities={cities}
        renderNowMs={Date.now()}
      />
    </>
  )
}
