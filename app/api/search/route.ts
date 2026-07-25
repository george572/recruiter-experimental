import { NextResponse } from "next/server"
import { getSamushaoApiBaseUrl } from "@/lib/scrape-jobs"

export const dynamic = "force-dynamic"

const MAX_LENGTH = 500

type SearchBody = {
  query?: unknown
  path?: unknown
  visitor_uid?: unknown
}

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
