const VISITOR_STORAGE_KEY = "recruiter-visitor-id"

function randomVisitorUid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "")
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

/** Stable anonymous visitor id (localStorage). Matches Samushao `visitors.visitor_uid`. */
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return ""
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY)?.trim()
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing
    const next = randomVisitorUid()
    window.localStorage.setItem(VISITOR_STORAGE_KEY, next)
    return next
  } catch {
    return randomVisitorUid()
  }
}

export async function pingVisitor(visitorId = getOrCreateVisitorId()): Promise<void> {
  if (!visitorId) return
  try {
    await fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_uid: visitorId,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
      keepalive: true,
    })
  } catch {
    // ignore offline / upstream
  }
}
