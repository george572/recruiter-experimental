import type { Job } from "@/lib/jobs"

export type JobFeedCategory =
  | "all"
  | "today"
  | "recommended"
  | "cv-match"
  | "high-salary"
  | "no-cv"
  | "latest"

type FeedCategoryDef = {
  id: JobFeedCategory
  /** Short label for chips — never includes ვაკანსიები */
  chipLabel: string
  /** Section heading — always ends with ვაკანსიები */
  sectionLabel: string
}

const FEED_CATEGORY_DEFS: FeedCategoryDef[] = [
  { id: "all", chipLabel: "ყველა", sectionLabel: "ყველა ვაკანსიები" },
  { id: "today", chipLabel: "დღევანდელი", sectionLabel: "დღევანდელი ვაკანსიები" },
  {
    id: "recommended",
    chipLabel: "შენთვის რეკომენდებული",
    sectionLabel: "შენთვის რეკომენდებული ვაკანსიები",
  },
  {
    id: "cv-match",
    chipLabel: "შენი CV ერგება",
    sectionLabel: "შენი CV ერგება ვაკანსიები",
  },
  {
    id: "high-salary",
    chipLabel: "ყველაზე მაღალანაზღაურებადი",
    sectionLabel: "ყველაზე მაღალანაზღაურებადი ვაკანსიები",
  },
  {
    id: "no-cv",
    chipLabel: "სადაც CV გარეშე მიგიღებენ",
    sectionLabel: "სადაც CV გარეშე მიგიღებენ ვაკანსიები",
  },
  { id: "latest", chipLabel: "უახლესი", sectionLabel: "უახლესი ვაკანსიები" },
]

/** Chip labels (without ვაკანსიები). */
export const JOB_FEED_CATEGORIES = FEED_CATEGORY_DEFS.map(({ id, chipLabel }) => ({
  id,
  label: chipLabel,
}))

/** Columns / section defs (excludes "all"), with full section titles. */
export const JOB_FEED_COLUMNS = FEED_CATEGORY_DEFS.filter(
  (def): def is FeedCategoryDef & { id: Exclude<JobFeedCategory, "all"> } => def.id !== "all"
).map(({ id, sectionLabel }) => ({
  id,
  label: sectionLabel,
}))

export function getFeedSectionLabel(category: JobFeedCategory): string {
  return (
    FEED_CATEGORY_DEFS.find((def) => def.id === category)?.sectionLabel ?? "ყველა ვაკანსიები"
  )
}

export function filterJobsByFeedCategory(jobs: Job[], category: JobFeedCategory): Job[] {
  switch (category) {
    case "recommended":
      return jobs.filter((job) => job.hrActive || job.postedDaysAgo <= 3)
    case "cv-match":
      return jobs.filter((job) => job.level === "Mid" || job.level === "Senior" || job.level === "Lead")
    case "today":
      return jobs.filter((job) => job.postedDaysAgo <= 1)
    case "high-salary":
      return [...jobs].sort((a, b) => b.salaryMax - a.salaryMax).filter((job) => job.salaryMax >= 5500)
    case "no-cv":
      return jobs.filter((job) => job.cvNotRequired)
    case "latest":
      return [...jobs]
        .filter((job) => job.postedDaysAgo <= 3)
        .sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
    default:
      return jobs
  }
}
