import { NextRequest, NextResponse } from "next/server";

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
  const visitorUid = String(
    request.nextUrl.searchParams.get("visitor_uid") || "",
  ).trim();
  const limitParam = Number(request.nextUrl.searchParams.get("limit") || 8);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 50)
    : 8;

  if (!visitorUid || visitorUid.length < 8) {
    return NextResponse.json({ queries: [] });
  }

  try {
    const qs = new URLSearchParams({
      visitor_uid: visitorUid.slice(0, 64),
      limit: String(limit),
    });
    const res = await fetch(
      `${getSamushaoApiBaseUrl()}/api/site-searches/recent?${qs}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      return NextResponse.json({ queries: [], fallback: true });
    }
    const data = (await res.json()) as UpstreamResponse;
    return NextResponse.json({
      queries: normalizeQueries(data.searches ?? []).slice(0, limit),
    });
  } catch (error) {
    console.error("[api/recent-searches]", error);
    return NextResponse.json({ queries: [], fallback: true });
  }
}
