"use client"

import { useMemo, useState } from "react"
import type { Job } from "@/lib/jobs"
import { JobCard } from "@/components/job-card"
import {
  JOB_FEED_COLUMNS,
  filterJobsByFeedCategory,
  type JobFeedCategory,
} from "@/lib/job-feed"

interface JobColumnsProps {
  jobs: Job[]
}

export function JobColumns({ jobs }: JobColumnsProps) {
  const columns = useMemo(
    () =>
      JOB_FEED_COLUMNS.map((column) => ({
        ...column,
        jobs: filterJobsByFeedCategory(jobs, column.id),
      })),
    [jobs]
  )

  const [activeByColumn, setActiveByColumn] = useState<Partial<Record<JobFeedCategory, string>>>(
    {}
  )

  if (jobs.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border px-4 text-center">
        <p className="text-base font-medium text-foreground">ფილტრებს შესაბამისი ვაკანსია არ მოერგო</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          სცადე ძიების გაფართოება ან რამდენიმე ფილტრის გასუფთავება.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="no-scrollbar flex min-h-0 min-w-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain lg:gap-5">
        {columns.map((column) => {
          const activeId = activeByColumn[column.id] ?? column.jobs[0]?.id ?? ""

          return (
            <section
              key={column.id}
              aria-labelledby={`job-column-${column.id}`}
              className="flex h-full w-[min(100%,400px)] max-w-[400px] shrink-0 snap-center flex-col overflow-hidden rounded-3xl bg-secondary/40 sm:w-[420px] sm:max-w-[420px] lg:w-[440px] lg:max-w-[440px]"
            >
              <header className="shrink-0 border-b border-border/50 px-5 py-4">
                <h2
                  id={`job-column-${column.id}`}
                  className="text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg"
                >
                  {column.label}{" "}
                  <span className="tabular-nums text-muted-foreground">({column.jobs.length})</span>
                </h2>
              </header>

              {column.jobs.length === 0 ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">ვაკანსია ჯერ არ არის</p>
                  <p className="max-w-[14rem] text-xs leading-5 text-muted-foreground">
                    ამ კატეგორიაში ამჟამად ვაკანსია არ მოიძებნა.
                  </p>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3 no-scrollbar lg:px-4 lg:py-4">
                  {column.jobs.map((job) => (
                    <div
                      key={job.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setActiveByColumn((prev) => ({ ...prev, [column.id]: job.id }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setActiveByColumn((prev) => ({ ...prev, [column.id]: job.id }))
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <JobCard job={job} active={job.id === activeId} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
