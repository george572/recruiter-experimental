import { NextResponse } from "next/server"
import { recordScrapedJobReaction } from "@/lib/scrape-jobs"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

function normalizeVote(value: unknown): "like" | "dislike" | null {
  if (value === "like" || value === "dislike") return value
  return null
}

/** Proxy POST /api/scraped-jobs/:id/reaction */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const decoded = decodeURIComponent(id)

  let body: { vote?: unknown; previous?: unknown } = {}
  try {
    body = (await request.json()) as { vote?: unknown; previous?: unknown }
  } catch {
    body = {}
  }

  if (body.vote != null && body.vote !== "" && normalizeVote(body.vote) == null) {
    return NextResponse.json(
      { error: "invalid_vote", message: 'vote must be "like", "dislike", or null' },
      { status: 400 }
    )
  }
  if (
    body.previous != null &&
    body.previous !== "" &&
    normalizeVote(body.previous) == null
  ) {
    return NextResponse.json(
      {
        error: "invalid_previous",
        message: 'previous must be "like", "dislike", or null',
      },
      { status: 400 }
    )
  }

  try {
    const result = await recordScrapedJobReaction(
      decoded,
      normalizeVote(body.vote),
      normalizeVote(body.previous)
    )
    return NextResponse.json({ ok: true, id: decoded, ...result })
  } catch (err) {
    console.error("[api/jobs/:id/reaction] failed:", err)
    return NextResponse.json(
      {
        error: "reaction_failed",
        message: err instanceof Error ? err.message : "failed",
      },
      { status: 502 }
    )
  }
}
