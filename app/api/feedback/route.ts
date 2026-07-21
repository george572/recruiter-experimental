import { NextResponse } from "next/server"
import { getSamushaoApiBaseUrl } from "@/lib/scrape-jobs"

export const dynamic = "force-dynamic"

const MAX_LENGTH = 2000

type FeedbackBody = {
  message?: unknown
  path?: unknown
}

export async function POST(request: Request) {
  let body: FeedbackBody
  try {
    body = (await request.json()) as FeedbackBody
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const message = String(body.message ?? "").trim()
  if (!message) {
    return NextResponse.json({ error: "empty_message" }, { status: 400 })
  }
  if (message.length > MAX_LENGTH) {
    return NextResponse.json({ error: "too_long" }, { status: 400 })
  }

  const path = String(body.path ?? "").slice(0, 500) || null
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null
  const payload = {
    message,
    path,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  }

  console.info("[feedback]", JSON.stringify(payload))

  try {
    const base = getSamushaoApiBaseUrl()
    const res = await fetch(`${base}/api/site-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error("[feedback] upstream failed:", res.status, text.slice(0, 200))
      // Still accept — message is in platform logs.
    }
  } catch (err) {
    console.error("[feedback] upstream unreachable:", err)
  }

  return NextResponse.json({ ok: true })
}
