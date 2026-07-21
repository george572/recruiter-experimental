"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowUpRight,
  Bookmark,
  Briefcase,
  MapPin,
  Moon,
  Sun,
} from "lucide-react"
import { JOB_SOURCES, formatJobSalary, type Job } from "@/lib/jobs"
import { formatDaysAgoDate, formatInt } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CompanyLogo } from "@/components/company-logo"
import { JobDescriptionBody } from "@/components/job-description-body"

const THEME_KEY = "audience-theme"
const EXPIRY_WINDOW_DAYS = 30
const SIMILAR_JOBS_COUNT = 4

const LABELS: Record<string, string> = {
  Engineering: "ინჟინერია",
  Design: "დიზაინი",
  Product: "პროდუქტი",
  Marketing: "მარკეტინგი",
  Data: "მონაცემები",
  Sales: "გაყიდვები",
  Finance: "ფინანსები",
  "Full-time": "სრული",
  "Part-time": "ნახევარი",
  Contract: "კონტრაქტი",
  Internship: "სტაჟირება",
  Remote: "დისტანციური",
  Hybrid: "ჰიბრიდული",
  "On-site": "ოფისიდან",
  Junior: "ჯუნიორი",
  Mid: "საშუალო",
  Senior: "სენიორი",
  Lead: "ლიდი",
}

const panelClass =
  "rounded-3xl border border-border/60 bg-card shadow-[0_1px_3px_rgba(20,24,40,0.04)]"

function formatSalary(job: Job) {
  return formatJobSalary(job)
}

function sourceMeta(source: Job["source"]) {
  return JOB_SOURCES.find((item) => item.id === source)
}

function similarityScore(base: Job, candidate: Job) {
  let score = 0
  if (candidate.category === base.category) score += 4
  if (candidate.level === base.level) score += 2
  if (candidate.workplace === base.workplace) score += 2
  if (candidate.type === base.type) score += 1
  if (candidate.company === base.company) score += 1
  const sharedTags = candidate.tags.filter((tag) => base.tags.includes(tag)).length
  score += sharedTags
  return score
}

function getSimilarJobs(job: Job, pool: Job[], limit = SIMILAR_JOBS_COUNT) {
  return pool
    .filter((candidate) => candidate.id !== job.id)
    .map((candidate) => ({
      candidate,
      score: similarityScore(job, candidate),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || a.candidate.postedDaysAgo - b.candidate.postedDaysAgo
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}

function MetaPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/60 px-2.5 py-1 text-[12px] font-medium text-foreground">
      {children}
    </span>
  )
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-3 last:border-b-0 sm:gap-4">
      <span className="shrink-0 text-[12.5px] text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right text-[13px] font-medium text-foreground">
        {value}
      </span>
    </div>
  )
}

function SimilarJobCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${encodeURIComponent(job.id)}`}
      scroll={false}
      className="flex items-start gap-3 rounded-2xl border border-border/50 bg-secondary/30 px-3 py-3 transition-colors hover:border-border hover:bg-secondary/50"
    >
      <CompanyLogo
        src={job.logo}
        company={job.company}
        size={36}
        className="rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold leading-4 text-foreground">
          {job.title}
        </p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">{job.company}</p>
        <p className="mt-1.5 text-[11px] font-medium tabular-nums text-foreground/90">
          {formatSalary(job)}
        </p>
      </div>
    </Link>
  )
}

export function JobDetail({
  job,
  allJobs = [],
}: {
  job: Job
  /** Optional SSR seed; usually empty — similar jobs load after paint. */
  allJobs?: Job[]
}) {
  const [dark, setDark] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [similarPool, setSimilarPool] = useState<Job[]>(allJobs)
  const source = sourceMeta(job.source)
  const uploaded = formatDaysAgoDate(job.postedDaysAgo)
  const expires = formatDaysAgoDate(job.postedDaysAgo - EXPIRY_WINDOW_DAYS)
  const similarJobs = useMemo(
    () => getSimilarJobs(job, similarPool),
    [job, similarPool]
  )

  useEffect(() => {
    // Record scrape click when the detail page is opened
    if (!job.id.includes(":")) return
    void fetch(`/api/jobs/${encodeURIComponent(job.id)}/click`, { method: "POST" }).catch(
      () => undefined
    )
  }, [job.id])

  // Similar jobs are not on the critical path — fetch a small pool after paint.
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    params.set("limit", "40")
    params.set("offset", "0")
    params.set("order", "newest")
    if (job.categoryId != null) {
      params.set("category_id", String(job.categoryId))
    }

    void fetch(`/api/jobs?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { jobs?: Job[] } | null) => {
        if (cancelled || !data?.jobs?.length) return
        setSimilarPool(data.jobs)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [job.id, job.categoryId])

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setDark(stored === "dark" || (!stored && prefersDark))
    setThemeReady(true)
  }, [])

  useEffect(() => {
    if (!themeReady) return
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light")
  }, [dark, themeReady])

  return (
    <div
      className={cn(
        "relative h-full min-h-0 w-full min-w-0 overflow-hidden",
        dark && "dark"
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[480px] translate-x-1/4 translate-y-1/4 rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-background">
        <header className="relative z-20 flex shrink-0 items-center justify-between gap-4 bg-background px-5 py-3.5 sm:px-6 lg:px-10">
          <Link
            href="/"
            scroll={false}
            className="relative z-10 inline-flex shrink-0 items-center transition-opacity hover:opacity-70"
          >
            <span className="font-sans text-lg font-semibold text-black dark:text-white">
              Recruiter.ge
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setDark((prev) => !prev)}
            aria-label={dark ? "ღია რეჟიმი" : "მუქი რეჟიმი"}
            className="relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            {dark ? (
              <Sun className="size-4" strokeWidth={1.75} />
            ) : (
              <Moon className="size-4" strokeWidth={1.75} />
            )}
          </button>
        </header>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto no-scrollbar">
          <div className="mx-auto w-full min-w-0 max-w-5xl px-5 pb-10 pt-4 sm:px-6 lg:px-10 lg:pb-12 lg:pt-5">
            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
              <div className="min-w-0 space-y-4">
                <section className={cn("min-w-0 p-5 sm:p-7", panelClass)}>
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
                      <CompanyLogo
                        src={job.logo}
                        company={job.company}
                        size={56}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] text-muted-foreground">
                          {job.company}
                        </p>
                        <h1 className="mt-1 text-xl font-semibold leading-snug break-words text-foreground text-balance sm:text-2xl">
                          {job.title}
                        </h1>
                        {job.hrActive ? (
                          <p className="mt-1.5 text-[12px] font-medium text-emerald-600">
                            HR აქტიურია
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="ვაკანსიის შენახვა"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                    >
                      <Bookmark className="size-4" strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    <MetaPill>
                      <MapPin className="size-3 shrink-0" strokeWidth={1.75} />
                      {job.location}
                    </MetaPill>
                    <MetaPill>
                      <Briefcase className="size-3 shrink-0" strokeWidth={1.75} />
                      {LABELS[job.type] ?? job.type}
                    </MetaPill>
                    <MetaPill>{LABELS[job.workplace] ?? job.workplace}</MetaPill>
                    <MetaPill>{LABELS[job.level] ?? job.level}</MetaPill>
                    <MetaPill>{LABELS[job.category] ?? job.category}</MetaPill>
                  </div>

                  <div className="mt-6 border-t border-border/60 pt-5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      ხელფასი
                    </p>
                    <p className="mt-1 break-words text-lg font-semibold tabular-nums text-foreground sm:text-xl">
                      {formatSalary(job)}
                      <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                        /თვე
                      </span>
                    </p>
                  </div>
                </section>

                <section className={cn("min-w-0 p-5 sm:p-7", panelClass)}>
                  <h2 className="text-[13.5px] font-semibold text-foreground">აღწერა</h2>
                  <JobDescriptionBody
                    html={job.descriptionHtml}
                    text={job.description}
                  />
                </section>
              </div>

              <aside className="min-w-0 space-y-4 lg:self-start">
                <section className={cn("min-w-0 p-5", panelClass)}>
                  <h2 className="text-[13px] font-semibold text-foreground">დეტალები</h2>
                  <div className="mt-1 min-w-0">
                    <FactRow label="გამოქვეყნება" value={uploaded} />
                    <FactRow label="ვადა" value={expires} />
                    <FactRow
                      label="აპლიკანტები"
                      value={formatInt(job.applicants)}
                    />
                    <FactRow
                      label="წყარო"
                      value={source?.label ?? job.source.toUpperCase()}
                    />
                    {job.cvNotRequired ? (
                      <FactRow label="CV" value="არ არის სავალდებულო" />
                    ) : null}
                  </div>

                  {source ? (
                    <div className="mt-4 flex min-w-0 items-center gap-2.5 rounded-2xl border border-border/50 bg-secondary/40 px-3 py-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
                        <Image
                          src={source.logo}
                          alt=""
                          width={20}
                          height={20}
                          className="size-4 object-contain"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">გამოქვეყნებულია</p>
                        <p className="truncate text-[12.5px] font-semibold text-foreground">
                          {source.label}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    onClick={async () => {
                      const applyUrl = job.applyUrl || job.sourceUrl
                      try {
                        await fetch(`/api/jobs/${encodeURIComponent(job.id)}/click`, {
                          method: "POST",
                        })
                      } catch {
                        // non-blocking
                      }
                      if (applyUrl) {
                        window.open(applyUrl, "_blank", "noopener,noreferrer")
                      }
                    }}
                  >
                    განაცხადის გაგზავნა
                    <ArrowUpRight
                      className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={2}
                    />
                  </button>
                </section>

                {similarJobs.length > 0 ? (
                  <section className={cn("min-w-0 p-5", panelClass)}>
                    <h2 className="text-[13px] font-semibold text-foreground">
                      მსგავსი ვაკანსიები
                    </h2>
                    <ul className="mt-3 space-y-2.5">
                      {similarJobs.map((similar) => (
                        <li key={similar.id}>
                          <SimilarJobCard job={similar} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
