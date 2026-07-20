"use client"

import Image from "next/image"
import { MapPin, Bookmark } from "lucide-react"
import { JOB_SOURCES, type Job } from "@/lib/jobs"

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

const EXPIRY_WINDOW_DAYS = 30

function formatDate(daysAgo: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function cityOnly(location: string) {
  return location.split(",")[0]?.trim() || location
}

interface JobCardCompactProps {
  job: Job
  active?: boolean
  onClick?: () => void
  /** Tighter layout so ~4–5 cards fit in a mobile viewport */
  dense?: boolean
}

export function JobCardCompact({
  job,
  active = false,
  onClick,
  dense = false,
}: JobCardCompactProps) {
  const place = dense ? cityOnly(job.location) : job.location
  const uploaded = formatDate(job.postedDaysAgo)
  const expires = formatDate(job.postedDaysAgo - EXPIRY_WINDOW_DAYS)
  const sourceLabel =
    JOB_SOURCES.find((item) => item.id === job.source)?.label ?? job.source

  if (dense) {
    return (
      <article
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onClick()
                }
              }
            : undefined
        }
        className={`w-full rounded-2xl border bg-card px-5 py-5 transition-colors ${
          onClick ? "cursor-pointer" : ""
        } ${
          active
            ? "border-primary/20 shadow-[0_2px_12px_-6px_rgba(20,24,40,0.08)]"
            : "border-border/60"
        }`}
      >
        {/* Row 1: logo + title/company — full width */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
            <Image
              src={job.logo || "/placeholder.svg"}
              alt={`${job.company} ლოგო`}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-semibold leading-4 text-foreground">
              {job.title}
            </h3>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {job.company}
            </p>
          </div>
        </div>

        {/* Meta: city + dates */}
        <div className="mt-3.5 flex items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{place}</span>
          </span>
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {uploaded}
            <span className="mx-1 text-muted-foreground/40">/</span>
            {expires}
          </span>
        </div>

        {/* Salary + source + save */}
        <div className="mt-3 flex items-center justify-between gap-3 pt-2.5">
          <p className="min-w-0 text-[13px] font-semibold tabular-nums leading-none text-foreground">
            {job.currency}
            {job.salaryMin.toLocaleString("ka-GE")} – {job.currency}
            {job.salaryMax.toLocaleString("ka-GE")}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[10px] font-semibold tracking-wide text-muted-foreground">
              {sourceLabel}
            </span>
            <button
              type="button"
              aria-label="ვაკანსიის შენახვა"
              onClick={(e) => e.stopPropagation()}
              className="-mr-0.5 flex size-4 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bookmark className="size-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      aria-current={active ? "true" : undefined}
      className={`flex h-[120px] w-full cursor-pointer items-center gap-4 rounded-2xl border bg-card px-4 transition-colors ${
        active
          ? "border-primary/20 shadow-[0_2px_12px_-6px_rgba(20,24,40,0.08)]"
          : "border-border/60 hover:border-border"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
        <Image
          src={job.logo || "/placeholder.svg"}
          alt={`${job.company} ლოგო`}
          width={44}
          height={44}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-sm font-semibold leading-5 text-foreground">
            {job.title}
          </h3>
          <button
            type="button"
            aria-label="ვაკანსიის შენახვა"
            onClick={(e) => e.stopPropagation()}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">{job.company}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {place}
          </span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">
            {LABELS[job.workplace] ?? job.workplace}
          </span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">
            {LABELS[job.type] ?? job.type}
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end justify-center gap-1 sm:flex">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {job.currency}
          {job.salaryMin.toLocaleString()} – {job.currency}
          {job.salaryMax.toLocaleString()}
        </span>
      </div>
    </article>
  )
}
