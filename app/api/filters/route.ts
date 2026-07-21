import { NextResponse } from "next/server"
import { fetchScrapedFilters, fetchScrapedSources } from "@/lib/scrape-jobs"

export const dynamic = "force-dynamic"

/** Proxy GET /api/scraped-jobs/filters (+ sources) */
export async function GET() {
  try {
    const [filters, sources] = await Promise.all([
      fetchScrapedFilters(),
      fetchScrapedSources(),
    ])
    return NextResponse.json({
      ok: true,
      ...filters,
      sources: sources.length ? sources : filters.sources,
      source: "scraped",
    })
  } catch (err) {
    console.error("[api/filters] failed:", err)
    return NextResponse.json(
      { ok: false, error: "filters_unavailable" },
      { status: 502 }
    )
  }
}
