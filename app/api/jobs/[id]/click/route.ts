import { NextResponse } from "next/server"
import { recordScrapedJobClick } from "@/lib/scrape-jobs"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

/** Proxy POST /api/scraped-jobs/:id/click */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params
  const decoded = decodeURIComponent(id)

  try {
    const result = await recordScrapedJobClick(decoded)
    return NextResponse.json({ ok: true, id: decoded, ...result })
  } catch (err) {
    console.error("[api/jobs/:id/click] failed:", err)
    return NextResponse.json(
      { error: "click_failed", message: err instanceof Error ? err.message : "failed" },
      { status: 502 }
    )
  }
}
