import { NextResponse } from "next/server"
import { getSamushaoApiBaseUrl } from "@/lib/scrape-jobs"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { visitor_uid?: unknown; user_agent?: unknown }
  try {
    body = (await request.json()) as { visitor_uid?: unknown; user_agent?: unknown }
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const visitorUid = String(body.visitor_uid ?? "").trim()
  if (!visitorUid || visitorUid.length < 8) {
    return NextResponse.json({ error: "invalid_visitor_uid" }, { status: 400 })
  }

  const payload = {
    visitor_uid: visitorUid.slice(0, 64),
    user_agent:
      String(body.user_agent ?? "").slice(0, 500) ||
      request.headers.get("user-agent")?.slice(0, 500) ||
      null,
  }

  try {
    const base = getSamushaoApiBaseUrl()
    const res = await fetch(`${base}/api/visitors/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error("[visitors] upstream failed:", res.status, data)
      return NextResponse.json(
        { error: "upstream_failed", detail: data },
        { status: 502 }
      )
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error("[visitors] upstream unreachable:", err)
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 })
  }
}
