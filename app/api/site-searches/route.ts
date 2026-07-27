import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_LENGTH = 500;

function getSamushaoApiBaseUrl() {
  return (
    process.env.SAMUSHAO_API_BASE ||
    process.env.NEXT_PUBLIC_SAMUSHAO_API_BASE ||
    "https://samushao.ge"
  ).replace(/\/$/, "");
}

type SearchBody = {
  query?: unknown;
  path?: unknown;
  visitor_uid?: unknown;
};

export async function POST(request: Request) {
  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const query = String(body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "empty_query" }, { status: 400 });
  }
  if (query.length > MAX_LENGTH) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }

  const visitorUid = String(body.visitor_uid ?? "").trim();
  const path = String(body.path ?? "").slice(0, 500) || null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;
  const payload = {
    query: query.slice(0, MAX_LENGTH),
    path,
    visitor_uid:
      visitorUid && visitorUid.length >= 8 ? visitorUid.slice(0, 64) : null,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${getSamushaoApiBaseUrl()}/api/site-searches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[site-searches] upstream failed:",
        res.status,
        text.slice(0, 200),
      );
    }
  } catch (err) {
    console.error("[site-searches] upstream unreachable:", err);
  }

  return NextResponse.json({ ok: true });
}
