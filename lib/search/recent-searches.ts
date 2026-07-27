export const RECENT_STORAGE_KEY = "recruiter-recent-searches";
const MAX_RECENT = 12;

function normalizeKey(query: string) {
  return query.trim().toLowerCase();
}

/** Instant local cache so the left column updates before the DB round-trip. */
export function readLocalRecentSearches(limit = 8): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of parsed) {
      const q = String(item ?? "").trim();
      if (!q) continue;
      const key = normalizeKey(q);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

export function pushLocalRecentSearch(query: string, limit = MAX_RECENT): string[] {
  const trimmed = query.trim();
  if (!trimmed) return readLocalRecentSearches(limit);
  const next = [
    trimmed,
    ...readLocalRecentSearches(MAX_RECENT).filter(
      (q) => normalizeKey(q) !== normalizeKey(trimmed),
    ),
  ].slice(0, limit);
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
  return next.slice(0, Math.min(limit, 8));
}

export async function recordSiteSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;

  try {
    const { getOrCreateVisitorId } = await import("@/lib/visitor-id");
    await fetch("/api/site-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: trimmed.slice(0, 500),
        path: typeof window !== "undefined" ? window.location.pathname : null,
        visitor_uid: getOrCreateVisitorId() || undefined,
      }),
      keepalive: true,
    });
  } catch {
    // ignore offline / upstream
  }
}
