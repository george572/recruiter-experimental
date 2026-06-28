import Image from "next/image"
import { MapPin, Bookmark } from "lucide-react"
import type { Job } from "@/lib/jobs"

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

interface JobCardCompactProps {
  job: Job
  active?: boolean
  onClick?: () => void
}

export function JobCardCompact({ job, active = false, onClick }: JobCardCompactProps) {
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
      className={`flex h-[120px] w-full cursor-pointer items-center gap-4 rounded-2xl border px-4 transition-colors ${
        active
          ? "border-primary/20 bg-secondary/50 shadow-[0_2px_12px_-6px_rgba(20,24,40,0.08)]"
          : "border-border/60 bg-secondary/30 hover:border-border hover:bg-secondary/50"
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
          <h3 className="truncate text-sm font-semibold leading-5 text-foreground">{job.title}</h3>
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
            {job.location}
          </span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">{LABELS[job.workplace] ?? job.workplace}</span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">{LABELS[job.type] ?? job.type}</span>
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end justify-center gap-1 sm:flex">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {job.currency}
          {job.salaryMin.toLocaleString()} – {job.currency}
          {job.salaryMax.toLocaleString()}
        </span>
        <span className="text-[11px] text-muted-foreground">/თვე</span>
      </div>
    </article>
  )
}
