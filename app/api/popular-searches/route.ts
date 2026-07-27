import { NextRequest, NextResponse } from "next/server";
import {
  fetchPopularQueries,
  getFallbackPopularQueries,
} from "@/lib/search/popular-queries";

export async function GET(request: NextRequest) {
  const limitParam = Number(request.nextUrl.searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitParam) ? limitParam : 50;

  try {
    const queries = await fetchPopularQueries(limit);
    return NextResponse.json({ queries });
  } catch (error) {
    console.error("[api/popular-searches]", error);
    return NextResponse.json(
      { queries: getFallbackPopularQueries(12), fallback: true },
      { status: 200 },
    );
  }
}
