import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function getSamushaoApiBaseUrl() {
  return (
    process.env.SAMUSHAO_API_BASE ||
    process.env.NEXT_PUBLIC_SAMUSHAO_API_BASE ||
    "https://samushao.ge"
  ).replace(/\/$/, "")
}

type UpstreamResponse = {
  ok?: boolean
  searches?: { query?: string }[]
}

function normalizeQueries(
  searches: { query?: string }[],
  excludeQueries: Set<string>,
): string[] {
  const seen = new Set<string>()
  const queries: string[] = []
  for (const item of searches) {
    const query = item.query?.trim()
    if (!query) continue
    const key = query.toLowerCase()
    if (seen.has(key) || excludeQueries.has(key)) continue
    seen.add(key)
    queries.push(query)
  }
  return queries
}

export async function GET(request: NextRequest) {
  const limitParam = Number(request.nextUrl.searchParams.get("limit") || 8)
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 50)
    : 8
  const visitorUid = String(
    request.nextUrl.searchParams.get("visitor_uid") ||
      request.nextUrl.searchParams.get("exclude_visitor_uid") ||
      "",
  ).trim()

  // Over-fetch so client/server can drop the visitor’s own query strings.
  const upstreamLimit = Math.min(limit * 4, 50)
  const qs = new URLSearchParams({ limit: String(upstreamLimit) })
  if (visitorUid.length >= 8) {
    qs.set("exclude_visitor_uid", visitorUid.slice(0, 64))
  }

  try {
    const res = await fetch(
      `${getSamushaoApiBaseUrl()}/api/site-searches/live?${qs}`,
      { cache: "no-store" },
    )
    if (!res.ok) {
      return NextResponse.json({ queries: [], error: "live_unavailable" })
    }
    const data = (await res.json()) as UpstreamResponse
    const queries = normalizeQueries(data.searches ?? [], new Set()).slice(
      0,
      limit,
    )
    return NextResponse.json({ queries, source: "live" })
  } catch (error) {
    console.error("[api/live-searches] live failed:", error)
    return NextResponse.json({ queries: [], error: "live_unavailable" })
  }
}
