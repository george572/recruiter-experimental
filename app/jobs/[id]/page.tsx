import type { Metadata } from "next"
import { cache } from "react"
import { notFound } from "next/navigation"
import { JobDetail } from "@/components/job-detail"
import { fetchScrapedJobById } from "@/lib/scrape-jobs"
import { getJobById, type Job } from "@/lib/jobs"
import {
  SITE_NAME,
  buildJobBreadcrumbJsonLd,
  buildJobPostingJsonLd,
  jobPath,
  jobShareDescription,
} from "@/lib/seo"

type JobPageProps = {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

/** Deduped across generateMetadata + page for the same request. */
const loadJob = cache(async (id: string): Promise<Job | null> => {
  try {
    const job = await fetchScrapedJobById(id)
    if (job) return job
  } catch {
    // fall through to mock data below
  }
  return getJobById(id) ?? null
})

export async function generateMetadata({
  params,
}: JobPageProps): Promise<Metadata> {
  const { id } = await params
  const decoded = decodeURIComponent(id)
  const job = await loadJob(decoded)

  if (!job) {
    return {
      title: "ვაკანსია ვერ მოიძებნა",
      robots: { index: false, follow: true },
    }
  }

  const title = `${job.title} — ${job.company}`
  const description = jobShareDescription(job)
  const canonical = jobPath(job.id)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
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

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params
  const decoded = decodeURIComponent(id)
  const job = await loadJob(decoded)

  if (!job) notFound()

  const nowMs = Date.now()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJobPostingJsonLd(job, nowMs)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJobBreadcrumbJsonLd(job)),
        }}
      />
      <JobDetail job={job} />
    </>
  )
}
