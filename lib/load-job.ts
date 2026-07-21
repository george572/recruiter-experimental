import { cache } from "react"
import { fetchScrapedJobById } from "@/lib/scrape-jobs"
import { getJobById, type Job } from "@/lib/jobs"

/** Deduped across generateMetadata + page for the same request. */
export const loadJob = cache(async (id: string): Promise<Job | null> => {
  try {
    const job = await fetchScrapedJobById(id)
    if (job) return job
  } catch {
    // fall through to mock data below
  }
  return getJobById(id) ?? null
})
