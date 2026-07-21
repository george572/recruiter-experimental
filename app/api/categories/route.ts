import { NextResponse } from "next/server"
import {
  fallbackCategoryCounts,
  fetchCategoryCounts,
} from "@/lib/category-counts"

export const dynamic = "force-dynamic"

/** Proxy GET /api/scraped-jobs/categories */
export async function GET() {
  try {
    const payload = await fetchCategoryCounts()
    return NextResponse.json({ ...payload, ok: true, source: "scraped" })
  } catch (err) {
    console.error("[api/categories] failed:", err)
    return NextResponse.json({
      ...fallbackCategoryCounts(),
      ok: false,
      source: "fallback",
      warning: "category_counts_unavailable",
    })
  }
}
