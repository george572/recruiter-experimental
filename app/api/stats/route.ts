import { NextResponse } from "next/server";
import { fetchTotalJobs } from "@/lib/search/jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const totalJobs = await fetchTotalJobs();
    return NextResponse.json(
      { totalJobs },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("[api/stats]", error);
    return NextResponse.json({ totalJobs: null }, { status: 502 });
  }
}
