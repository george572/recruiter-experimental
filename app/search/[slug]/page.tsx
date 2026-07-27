import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { JobSearch } from "@/components/search/job-search"
import { searchJobs } from "@/lib/search/jobs"
import { interpretJobQuery } from "@/lib/search/smart-query"
import type { JobResult } from "@/lib/search/types"
import {
  resolveSearchQuery,
  searchPath,
  slugifyQuery,
} from "@/lib/search/seo-keywords"
import {
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  jobPath,
  toMetaDescription,
} from "@/lib/seo"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

const SSR_LIST_SIZE = 20

function buildSearchItemListJsonLd(
  jobs: JobResult[],
  name: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(jobPath(job.id)),
      name: `${job.title} — ${job.company}`,
    })),
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params
  const sp = await searchParams
  const query = resolveSearchQuery(slug, sp.q)
  if (!query) {
    return { title: "ძებნა", robots: { index: false, follow: true } }
  }

  const canonicalSlug = slugifyQuery(query)
  const canonical = searchPath(query)
  const title = `${query} ვაკანსიები საქართველოში`
  const description = toMetaDescription(
    `აქტუალური „${query}“ ვაკანსიები Recruiter.ge-ზე — ყველა ძირითადი ქართული საიტიდან ერთ ადგილას. მოძებნე და გააგზავნე განაცხადი პირდაპირ დამსაქმებელთან.`,
  )

  // Soft-check emptiness for robots (cheap first-page fetch).
  let indexable = true
  try {
    const smart = await interpretJobQuery(query)
    if (smart.noResults) indexable = false
    else {
      const page = await searchJobs(smart.filters, {
        limit: 5,
        offset: 0,
      })
      indexable = page.total > 0 || page.results.length > 0
    }
  } catch {
    indexable = true
  }

  return {
    title,
    description,
    alternates: { canonical },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${title} | ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    other: {
      "search-slug": canonicalSlug,
    },
  }
}

export default async function SearchKeywordPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params
  const sp = await searchParams
  const query = resolveSearchQuery(slug, sp.q)
  if (!query) notFound()

  const pageRaw = Number(sp.page || "1")
  const pageNum =
    Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

  let results: JobResult[] = []
  let total = 0
  let interpretation = query

  try {
    const smart = await interpretJobQuery(query)
    interpretation = smart.interpretation || query
    if (!smart.noResults) {
      const offset = (pageNum - 1) * SSR_LIST_SIZE
      const listing = await searchJobs(smart.filters, {
        limit: SSR_LIST_SIZE,
        offset,
      })
      results = listing.results
      total = listing.total
    }
  } catch (err) {
    console.error("[search/slug] search failed:", err)
  }

  const heading = `${query} ვაკანსიები საქართველოში`
  const intro =
    total > 0
      ? `${total.toLocaleString("en-US")} ვაკანსია მოთხოვნით „${query}“. შედეგები იკრიბება jobs.ge, hr.ge და სხვა წყაროებიდან.`
      : `ამჟამად ვერ მოიძებნა ვაკანსია მოთხოვნით „${query}“. სცადე სხვა ფორმულირება ან დაათვალიერე პოპულარული კატეგორიები.`

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "მთავარი", url: absoluteUrl("/") },
    { name: query, url: absoluteUrl(searchPath(query)) },
  ])

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {results.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildSearchItemListJsonLd(results, heading)),
          }}
        />
      ) : null}

      {/* Crawlable SEO block — visible to bots and users who disable JS. */}
      <section className="border-b border-border bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              მთავარი
            </Link>
            <span aria-hidden className="mx-1.5">
              /
            </span>
            <span className="text-foreground">{query}</span>
          </nav>
          <h1 className="font-brand text-3xl font-normal text-foreground sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {intro}
          </p>
          {interpretation && interpretation !== query ? (
            <p className="mt-1 text-sm text-muted-foreground">
              ინტერპრეტაცია: {interpretation}
            </p>
          ) : null}

          {results.length > 0 ? (
            <ol className="mt-6 flex flex-col divide-y divide-border">
              {results.map((job) => (
                <li key={job.id} className="py-3">
                  <Link
                    href={jobPath(job.id)}
                    className="group block"
                  >
                    <span className="text-base font-semibold text-foreground group-hover:underline">
                      {job.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {[job.company, job.city, job.salary]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </section>

      <Suspense fallback={null}>
        <JobSearch initialQuery={query} initialPage={pageNum} />
      </Suspense>
    </div>
  )
}
