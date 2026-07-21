import Image from "next/image"
import { MapPin, Briefcase, Clock, Users, ArrowUpRight, Bookmark } from "lucide-react"
import type { Job } from "@/lib/jobs"
import { formatJobSalary } from "@/lib/jobs"

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

interface JobCardProps {
  job: Job
  active: boolean
}

export function JobCard({ job, active }: JobCardProps) {
  return (
    <article
      aria-current={active ? "true" : undefined}
      className={`flex w-full min-w-0 flex-col rounded-3xl bg-white p-5 md:p-6 lg:shadow-none ${
        active
          ? "shadow-[0_4px_16px_-8px_rgba(20,24,40,0.1)]"
          : "shadow-[0_2px_12px_-6px_rgba(20,24,40,0.07)]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:gap-3.5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary sm:h-11 sm:w-11">
              <Image
                src={job.logo || "/placeholder.svg"}
                alt={`${job.company} ლოგო`}
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="truncate text-xs font-medium text-muted-foreground sm:text-[13px]">{job.company}</span>
              {job.hrActive && (
                <span className="mt-0.5 text-[11px] font-medium text-emerald-600">HR აქტიურია</span>
              )}
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground sm:text-[11px]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>
          </div>
          <button
            aria-label="ვაკანსიის შენახვა"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground sm:h-9 sm:w-9"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold leading-6 text-foreground text-balance sm:text-base md:text-lg">
          {job.title}
        </h3>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge icon={<Briefcase className="h-3 w-3" />}>{LABELS[job.type] ?? job.type}</Badge>
          <Badge icon={<MapPin className="h-3 w-3" />}>{LABELS[job.workplace] ?? job.workplace}</Badge>
          <Badge>{LABELS[job.level] ?? job.level}</Badge>
          <Badge>{LABELS[job.category] ?? job.category}</Badge>
        </div>

        <p className="text-xs leading-5 text-muted-foreground sm:text-[13px] sm:leading-5">
          {job.description}
        </p>
      </div>

      {/* Bottom row */}
      <div className="mt-3.5 flex flex-col gap-3 pt-1 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground sm:text-[11px]">ხელფასი</span>
          <span className="text-sm font-semibold text-foreground sm:text-base">
            {formatJobSalary(job)}
            {job.salaryMin > 0 || job.salaryMax > 0 ? (
              <span className="ml-1 text-[11px] font-normal text-muted-foreground sm:text-xs">
                /თვე
              </span>
            ) : null}
          </span>
          <div className="mt-1 grid grid-cols-1 gap-1 text-[10px] text-muted-foreground sm:flex sm:items-center sm:gap-3 sm:text-[11px]">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {job.postedDaysAgo} დღის წინ
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {job.applicants} აპლიკანტი
            </span>
          </div>
        </div>

        <button className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto sm:py-3">
          განაცხადის გაგზავნა
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>

    </article>
  )
}

function Badge({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground sm:px-2.5 sm:py-1 sm:text-[11px]">
      {icon}
      {children}
    </span>
  )
}
