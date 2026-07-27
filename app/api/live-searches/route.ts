import { NextRequest, NextResponse } from "next/server";
import { fetchPopularQueries } from "@/lib/search/popular-queries";

export const dynamic = "force-dynamic";

function getSamushaoApiBaseUrl() {
  return (
    process.env.SAMUSHAO_API_BASE ||
    process.env.NEXT_PUBLIC_SAMUSHAO_API_BASE ||
    "https://samushao.ge"
  ).replace(/\/$/, "");
}

type UpstreamResponse = {
  ok?: boolean;
  searches?: { query?: string }[];
};

function normalizeQueries(searches: { query?: string }[]): string[] {
  const seen = new Set<string>();
  const queries: string[] = [];
  for (const item of searches) {
    const query = item.query?.trim();
    if (!query) continue;
    const key = query.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push(query);
  }
  return queries;
}

export async function GET(request: NextRequest) {
  const limitParam = Number(request.nextUrl.searchParams.get("limit") || 8);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 50)
    : 8;

  try {
    const res = await fetch(
      `${getSamushaoApiBaseUrl()}/api/site-searches/live?limit=${limit}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const data = (await res.json()) as UpstreamResponse;
      const queries = normalizeQueries(data.searches ?? []).slice(0, limit);
      if (queries.length > 0) {
        return NextResponse.json({ queries });
      }
    }
  } catch (error) {
    console.error("[api/live-searches] live failed:", error);
  }

  // Real popular queries from DB only — never invent hardcoded mock pills.
  try {
    const queries = await fetchPopularQueries(limit);
    return NextResponse.json({
      queries: queries.slice(0, limit),
      source: "popular",
    });
  } catch (error) {
    console.error("[api/live-searches]", error);
    return NextResponse.json({ queries: [] });
  }
}
