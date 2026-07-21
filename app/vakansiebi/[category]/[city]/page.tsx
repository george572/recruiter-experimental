import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AudienceOverview } from "@/components/audience-overview"
import { loadListingData } from "@/lib/listing"
import { DEFAULT_SAMUSHAO_FILTERS } from "@/lib/samushao-filters"
import {
  categoryPath,
  cityPath,
  getCategoryBySlug,
  getCityBySlug,
} from "@/lib/taxonomy"
import {
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  jobPath,
} from "@/lib/seo"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ category: string; city: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, city } = await params
  const cat = getCategoryBySlug(category)
  const town = getCityBySlug(city)
  if (!cat || !town) {
    return { title: "ვაკანსიები ვერ მოიძებნა", robots: { index: false, follow: true } }
  }

  const title = `${cat.name} ვაკანსიები ${town.locative}`
  const description = `აქტუალური ${cat.name} ვაკანსიები ${town.locative}. იპოვე სამუშაო და გააგზავნე CV პირდაპირ დამსაქმებელთან ${SITE_NAME}-ზე.`
  const canonical = cityPath(cat.slug, town.slug)

  return {
    title,
    description,
    alternates: { canonical },
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
  }
}

export default async function CategoryCityPage({ params }: Props) {
  const { category, city } = await params
  const cat = getCategoryBySlug(category)
  const town = getCityBySlug(city)
  if (!cat || !town) notFound()

  const data = await loadListingData({ categoryName: cat.name, city: town.name })
  const count = data.total || data.jobs.length
  const heading = `${cat.name} ვაკანსიები ${town.locative}`
  const initialFilters = {
    ...DEFAULT_SAMUSHAO_FILTERS,
    categories: [cat.name],
    cities: [town.name],
  }

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "ვაკანსიები", url: absoluteUrl("/") },
    { name: cat.name, url: absoluteUrl(categoryPath(cat.slug)) },
    { name: town.name, url: absoluteUrl(cityPath(cat.slug, town.slug)) },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {data.jobs.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildItemListJsonLd(data.jobs, heading)),
          }}
        />
      ) : null}

      {/* Crawlable, keyword-rich content + internal links (non-visual). */}
      <div className="sr-only">
        <h1>{heading}</h1>
        <p>
          {`${SITE_NAME} — ${cat.name} მიმართულების აქტუალური ვაკანსიები ${town.locative}.`}
          {count > 0 ? ` ხელმისაწვდომია ${count}+ პოზიცია.` : ""}
          {` დაათვალიერე ვაკანსიები და გააგზავნე განაცხადი პირდაპირ დამსაქმებელთან.`}
        </p>
        {data.jobs.length > 0 ? (
          <ul>
            {data.jobs.map((job) => (
              <li key={job.id}>
                <a href={jobPath(job.id)}>
                  {job.title} — {job.company}
                  {job.location ? ` (${job.location})` : ""}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <AudienceOverview
        initialJobs={data.jobs}
        initialTotal={data.total}
        initialHasMore={data.hasMore}
        initialNextOffset={data.nextOffset}
        categories={data.categories}
        sources={data.sources}
        cities={data.cities}
        initialFilters={initialFilters}
        renderNowMs={Date.now()}
      />
    </>
  )
}
