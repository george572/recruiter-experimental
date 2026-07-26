const KA_MONTHS_SHORT = [
  "იან",
  "თებ",
  "მარ",
  "აპრ",
  "მაი",
  "ივნ",
  "ივლ",
  "აგვ",
  "სექ",
  "ოქტ",
  "ნოე",
  "დეკ",
] as const

/** Fixed thousands separator — Node/browser Intl for ka-GE can disagree. */
export function formatInt(n: number): string {
  const abs = String(Math.trunc(Math.abs(n)))
  const grouped = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return n < 0 ? `-${grouped}` : grouped
}

/**
 * Calendar date from a "days ago" offset.
 * Pass the same `nowMs` from the server into the client tree so SSR HTML matches hydration.
 */
export function formatDaysAgoDate(daysAgo: number, nowMs?: number): string {
  const date = new Date(Number.isFinite(nowMs) ? (nowMs as number) : Date.now())
  date.setUTCHours(12, 0, 0, 0)
  const offset = Number(daysAgo)
  date.setUTCDate(date.getUTCDate() - (Number.isFinite(offset) ? offset : 0))
  const day = date.getUTCDate()
  const month = KA_MONTHS_SHORT[date.getUTCMonth()] ?? "იან"
  const year = date.getUTCFullYear()
  return `${day} ${month}. ${year}`
}

/** Format an ISO / date string in Tbilisi calendar day (ka short month). */
export function formatIsoDateKa(iso: string | null | undefined): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tbilisi",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date)
  const day = Number(parts.find((p) => p.type === "day")?.value || 0)
  const monthIdx = Number(parts.find((p) => p.type === "month")?.value || 1) - 1
  const year = Number(parts.find((p) => p.type === "year")?.value || 0)
  const month = KA_MONTHS_SHORT[monthIdx] ?? "იან"
  return `${day} ${month}. ${year}`
}
