"use client"

import dynamic from "next/dynamic"

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((mod) => mod.Analytics),
  { ssr: false },
)

export function ProductionAnalytics() {
  if (process.env.NODE_ENV !== "production") return null
  return <Analytics />
}
