import { NextResponse } from "next/server"
import { fetchScrapedJobById } from "@/lib/scrape-jobs"
import { getJobById } from "@/lib/jobs"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

/** Single job only — similar jobs are loaded client-side so this stays fast. */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const decoded = decodeURIComponent(id)

  try {
    const job = await fetchScrapedJobById(decoded)
    if (job) {
      return NextResponse.json({ job, source: "scraped" })
    }
  } catch (err) {
    console.error("[api/jobs/:id] scrape fetch failed:", err)
  }

  const mock = getJobById(decoded)
  if (!mock) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ job: mock, source: "mock" })
}
