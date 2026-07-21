import type { MetadataRoute } from "next"
import { fetchScrapedJobs } from "@/lib/scrape-jobs"
import { JOBS, type Job } from "@/lib/jobs"
import { SITE_URL, jobPath } from "@/lib/seo"
import {
  CATEGORY_TAXONOMY,
  CITY_TAXONOMY,
  categoryPath,
  cityPath,
} from "@/lib/taxonomy"

export const dynamic = "force-dynamic"
export const revalidate = 3600

/** How many job URLs to expose in the sitemap. */
const MAX_JOB_URLS = 2000
const PAGE_SIZE = 200

async function collectJobs(): Promise<Job[]> {
  const seen = new Set<string>()
  const jobs: Job[] = []

  try {
    for (let offset = 0; offset < MAX_JOB_URLS; offset += PAGE_SIZE) {
      const page = await fetchScrapedJobs({
        limit: PAGE_SIZE,
        offset,
        order: "newest",
      })
      for (const job of page.jobs) {
        if (seen.has(job.id)) continue
        seen.add(job.id)
        jobs.push(job)
      }
      if (!page.hasMore || page.jobs.length === 0) break
    }
  } catch (err) {
    console.error("[sitemap] scraped jobs unavailable, using mock:", err)
  }

  if (jobs.length === 0) {
    for (const job of JOBS) {
      if (seen.has(job.id)) continue
      seen.add(job.id)
      jobs.push(job)
    }
  }

  return jobs.slice(0, MAX_JOB_URLS)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
  ]

  // Programmatic SEO landing pages: category and category × city.
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_TAXONOMY.map((cat) => ({
    url: `${SITE_URL}${categoryPath(cat.slug)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }))

  const cityRoutes: MetadataRoute.Sitemap = CATEGORY_TAXONOMY.flatMap((cat) =>
    CITY_TAXONOMY.map((town) => ({
      url: `${SITE_URL}${cityPath(cat.slug, town.slug)}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    }))
  )

  const jobs = await collectJobs()
  const dayMs = 1000 * 60 * 60 * 24

  const jobRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${SITE_URL}${jobPath(job.id)}`,
    lastModified: new Date(now.getTime() - Math.max(0, job.postedDaysAgo) * dayMs),
    changeFrequency: "daily",
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes, ...cityRoutes, ...jobRoutes]
}
