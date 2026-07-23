"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

/**
 * Soft-nav job intercept mounts over the list. Next can update the URL to `/`
 * without clearing the @modal slot — hide the overlay when we're no longer on
 * a job path so the list underneath is usable again.
 */
export function JobModalOverlay({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (!pathname.startsWith("/jobs/")) return null

  return <div className="fixed inset-0 z-50 bg-background">{children}</div>
}
