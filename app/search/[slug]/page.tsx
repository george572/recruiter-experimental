import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { JobSearch } from "@/components/search/job-search"
import { searchJobs } from "@/lib/search/jobs"
import { interpretJobQuery } from "@/lib/search/smart-query"
import {
  resolveSearchQuery,
  searchPath,
  slugifyQuery,
} from "@/lib/search/seo-keywords"
import { SITE_NAME, toMetaDescription } from "@/lib/seo"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; page?: string }>
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

  return (
    <Suspense fallback={null}>
      <JobSearch initialQuery={query} initialPage={pageNum} />
    </Suspense>
  )
}
