import { NextResponse } from "next/server"
import { getSamushaoApiBaseUrl } from "@/lib/scrape-jobs"

export const dynamic = "force-dynamic"

/** Proxy GET /api/site-searches/popular */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get("limit")
  const params = new URLSearchParams()
  if (limit) params.set("limit", limit)

  try {
    const base = getSamushaoApiBaseUrl()
    const qs = params.toString()
    const res = await fetch(
      `${base}/api/site-searches/popular${qs ? `?${qs}` : ""}`,
      { cache: "no-store" }
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream_failed", detail: data },
        { status: 502 }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("[search/popular] upstream unreachable:", err)
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 })
  }
}
