"use client"

import { useEffect, useRef } from "react"
import { getOrCreateVisitorId } from "@/lib/visitor-id"

/** Wait until typing has clearly stopped before persisting. */
const RECORD_DEBOUNCE_MS = 1500
const MIN_QUERY_LENGTH = 2

/** Persist a finished search query to the backend. */
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

/**
 * Persist searches only after the user stops typing.
 * Do not call this with the filter debounce value — that fires every ~350ms pause
 * and saves every partial keystroke (თ, თბ, თბი, …).
 */
export function useRecordSiteSearch(query: string) {
  const lastRecordedRef = useRef("")

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) return
    if (trimmed === lastRecordedRef.current) return

    const timer = window.setTimeout(() => {
      lastRecordedRef.current = trimmed
      void recordSiteSearch(trimmed)
    }, RECORD_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [query])
}
