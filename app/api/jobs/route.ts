import { NextResponse } from "next/server"
import { fetchScrapedJobs, type ScrapedJobsQuery } from "@/lib/scrape-jobs"
import { fetchCategoryCounts, categoryNameMapFromCounts } from "@/lib/category-counts"
import { JOBS } from "@/lib/jobs"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query: ScrapedJobsQuery = {
    source: searchParams.get("source") || undefined,
    q: searchParams.get("q") || undefined,
    limit: Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 200),
    offset: Math.max(Number(searchParams.get("offset") || 0), 0),
    order:
      searchParams.get("order") === "newest" ? "newest" : "round_robin",
    city: searchParams.get("city") || undefined,
    employmentType: searchParams.get("employment_type") || undefined,
  }

  const qFieldsRaw = searchParams.get("q_fields")
  if (qFieldsRaw != null) {
    const allowed = new Set(["title", "company", "description"] as const)
    query.qFields = qFieldsRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((f): f is "title" | "company" | "description" =>
        allowed.has(f as "title" | "company" | "description")
      )
  }

  const workingModeRaw = (searchParams.get("working_mode") || "").toLowerCase()
  if (workingModeRaw === "remote" || workingModeRaw === "onsite") {
    query.workingMode = workingModeRaw
  }
  const experienceRaw = searchParams.get("experience")
  if (experienceRaw) {
    query.experience = experienceRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const categoryIdRaw = searchParams.get("category_id")
  if (categoryIdRaw) {
    const categoryId = Number(categoryIdRaw)
    if (Number.isFinite(categoryId)) query.categoryId = categoryId
  }

  const salaryMin = searchParams.get("salary_min")
  const salaryMax = searchParams.get("salary_max")
  if (salaryMin) {
    const n = Number(salaryMin)
    if (Number.isFinite(n)) query.salaryMin = n
  }
  if (salaryMax) {
    const n = Number(salaryMax)
    if (Number.isFinite(n)) query.salaryMax = n
  }

  try {
    let categoryNames: Map<number, string> | undefined
    try {
      const cats = await fetchCategoryCounts()
      categoryNames = categoryNameMapFromCounts(cats.categories)
    } catch {
      // optional enrichment
    }

    const page = await fetchScrapedJobs(query, categoryNames)
    return NextResponse.json({
      jobs: page.jobs,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
      hasMore: page.hasMore,
      has_more: page.hasMore,
      next_offset: page.nextOffset,
      source: "scraped",
    })
  } catch (err) {
    console.error("[api/jobs] scrape fetch failed, falling back to mock:", err)
    const offset = query.offset || 0
    const limit = query.limit || 50
    const jobs = JOBS.slice(offset, offset + limit)
    return NextResponse.json({
      jobs,
      total: JOBS.length,
      limit,
      offset,
      hasMore: offset + jobs.length < JOBS.length,
      has_more: offset + jobs.length < JOBS.length,
      next_offset: offset + jobs.length < JOBS.length ? offset + jobs.length : null,
      source: "mock",
      warning: "scraped_jobs_unavailable",
    })
  }
}
