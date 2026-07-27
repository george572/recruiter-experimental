import { NextRequest, NextResponse } from "next/server"
import { getSamushaoApiBaseUrl } from "@/lib/scrape-jobs"
import { searchJobs } from "@/lib/search/jobs"
import {
  filtersFromSearchParams,
  filtersToSearchParams,
  interpretJobQuery,
  type SmartJobFilters,
} from "@/lib/search/smart-query"

export const dynamic = "force-dynamic"

const MAX_LENGTH = 500

type SearchBody = {
  query?: unknown
  path?: unknown
  visitor_uid?: unknown
}

/** Drop constraints gradually until we get hits (chat queries can be over-specific). */
async function searchWithRelaxation(
  filters: SmartJobFilters,
  options: { limit: number; offset: number },
) {
  // Never drop category / city / salary — those are core user intent.
  const attempts: SmartJobFilters[] = [
    filters,
    filters.workingMode ? { ...filters, workingMode: undefined } : filters,
    filters.experience?.length
      ? { ...filters, workingMode: undefined, experience: undefined }
      : filters,
    filters.categoryId != null
      ? {
          q: "",
          categoryId: filters.categoryId,
          categoryName: filters.categoryName,
          city: filters.city,
          salaryMin: filters.salaryMin,
          salaryMax: filters.salaryMax,
          hasSalary: filters.hasSalary,
          uploadedSince: filters.uploadedSince,
          order: filters.order,
          preferRoleFamilies: filters.preferRoleFamilies,
          preferSkills: filters.preferSkills,
          preferPayCadence: filters.preferPayCadence,
          intentId: filters.intentId,
        }
      : {
          q: filters.q,
          qAlternates: filters.qAlternates,
          qBranches: filters.qBranches,
          city: filters.city,
          salaryMin: filters.salaryMin,
          salaryMax: filters.salaryMax,
          hasSalary: filters.hasSalary,
          uploadedSince: filters.uploadedSince,
          preferRoleFamilies: filters.preferRoleFamilies,
          preferSkills: filters.preferSkills,
          preferPayCadence: filters.preferPayCadence,
          intentId: filters.intentId,
          order: filters.order,
        },
  ]

  const seen = new Set<string>()
  let lastPage: Awaited<ReturnType<typeof searchJobs>> | null = null
  let used = filters

  for (const attempt of attempts) {
    const key = JSON.stringify(attempt)
    if (seen.has(key)) continue
    seen.add(key)

    const page = await searchJobs(attempt, options)
    lastPage = page
    used = attempt
    if (page.total > 0 || page.results.length > 0) break
  }

  return {
    page: lastPage || (await searchJobs(filters, options)),
    filters: used,
  }
}

/** Smart job search used by the public Recruiter.ge homepage. */
export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? ""
  const limit = Number(request.nextUrl.searchParams.get("limit") || 20)
  const offset = Number(request.nextUrl.searchParams.get("offset") || 0)
  const useSmart =
    request.nextUrl.searchParams.get("smart") !== "0" && offset === 0

  const safeLimit = Number.isFinite(limit) ? limit : 20
  const safeOffset = Number.isFinite(offset) ? offset : 0

  try {
    let interpretation = rawQuery.trim()
    let fromGemini = false
    let filters = filtersFromSearchParams(request.nextUrl.searchParams)

    if (useSmart && rawQuery.trim()) {
      const smart = await interpretJobQuery(rawQuery)
      filters = smart.filters
      interpretation = smart.interpretation
      fromGemini = smart.fromGemini

      if (smart.noResults) {
        return NextResponse.json({
          query: rawQuery,
          interpretation,
          fromGemini,
          filters,
          results: [],
          total: 0,
          limit: safeLimit,
          offset: safeOffset,
          hasMore: false,
          nextOffset: null,
          filterParams: Object.fromEntries(filtersToSearchParams(filters)),
        })
      }
    } else if (!filters.q && rawQuery.trim()) {
      filters = { ...filters, q: rawQuery.trim() }
    }

    // Only relax on the first page of a smart search — paging must stay stable.
    const { page, filters: usedFilters } =
      useSmart && safeOffset === 0
        ? await searchWithRelaxation(filters, {
            limit: safeLimit,
            offset: safeOffset,
          })
        : {
            page: await searchJobs(filters, {
              limit: safeLimit,
              offset: safeOffset,
            }),
            filters,
          }

    return NextResponse.json({
      query: rawQuery,
      interpretation,
      fromGemini,
      filters: usedFilters,
      results: page.results,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
      hasMore: page.hasMore,
      nextOffset: page.nextOffset,
      filterParams: Object.fromEntries(filtersToSearchParams(usedFilters)),
    })
  } catch (error) {
    console.error("[api/search]", error)
    return NextResponse.json(
      {
        query: rawQuery,
        interpretation: rawQuery,
        fromGemini: false,
        filters: { q: rawQuery },
        results: [],
        total: 0,
        limit: safeLimit,
        offset: safeOffset,
        hasMore: false,
        nextOffset: null,
        error: "search_unavailable",
      },
      { status: 502 },
    )
  }
}

/** Persist a finished search query for analytics (legacy audience board). */
export async function POST(request: Request) {
  let body: SearchBody
  try {
    body = (await request.json()) as SearchBody
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const query = String(body.query ?? "").trim()
  if (!query) {
    return NextResponse.json({ error: "empty_query" }, { status: 400 })
  }
  if (query.length > MAX_LENGTH) {
    return NextResponse.json({ error: "too_long" }, { status: 400 })
  }

  const visitorUid = String(body.visitor_uid ?? "").trim()
  const path = String(body.path ?? "").slice(0, 500) || null
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null
  const payload = {
    query: query.slice(0, MAX_LENGTH),
    path,
    visitor_uid:
      visitorUid && visitorUid.length >= 8 ? visitorUid.slice(0, 64) : null,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  }

  console.info("[search]", JSON.stringify(payload))

  try {
    const base = getSamushaoApiBaseUrl()
    const res = await fetch(`${base}/api/site-searches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error("[search] upstream failed:", res.status, text.slice(0, 200))
      // Still accept — query is in platform logs.
    }
  } catch (err) {
    console.error("[search] upstream unreachable:", err)
  }

  return NextResponse.json({ ok: true })
}
