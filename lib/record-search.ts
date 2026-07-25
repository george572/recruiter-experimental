import { getOrCreateVisitorId } from "@/lib/visitor-id"

/** Persist a finished (debounced) search query to the backend. */
export async function recordSiteSearch(query: string): Promise<void> {
  const trimmed = query.trim()
  if (!trimmed) return

  try {
    await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: trimmed.slice(0, 500),
        path: typeof window !== "undefined" ? window.location.pathname : null,
        visitor_uid: getOrCreateVisitorId() || undefined,
      }),
      keepalive: true,
    })
  } catch {
    // ignore offline / upstream
  }
}
