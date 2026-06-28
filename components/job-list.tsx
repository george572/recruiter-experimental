"use client"

import { useEffect, useState } from "react"
import type { Job } from "@/lib/jobs"
import { JobCardCompact } from "@/components/job-card-compact"

interface JobListProps {
  jobs: Job[]
  showJobs: boolean
  onShowAll: () => void
}

export function JobList({ jobs, showJobs, onShowAll }: JobListProps) {
  const [activeId, setActiveId] = useState(jobs[0]?.id ?? "")

  useEffect(() => {
    if (jobs.length === 0) {
      setActiveId("")
      return
    }
    if (!jobs.some((job) => job.id === activeId)) {
      setActiveId(jobs[0].id)
    }
  }, [jobs, activeId])

  if (!showJobs) {
    return (
      <section className="flex min-h-0 w-full flex-1 flex-col rounded-3xl bg-white p-6">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
          <p className="max-w-sm text-base leading-7 text-muted-foreground">
            აირჩიე ფილტრები, და პლატფორმა მოგიძებნის შესაბამის ვაკანსიებს.
          </p>
          <p className="text-sm text-muted-foreground">ან</p>
          <button
            type="button"
            onClick={onShowAll}
            className="cursor-pointer rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            ნახე ყველა ვაკანსია
          </button>
        </div>
      </section>
    )
  }

  if (jobs.length === 0) {
    return (
      <section className="flex min-h-0 w-full flex-1 flex-col rounded-3xl bg-white p-6">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-base font-medium text-foreground">ფილტრებს შესაბამისი ვაკანსია არ მოერგო</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            სცადე ძიების გაფართოება ან რამდენიმე ფილტრის გასუფთავება.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col rounded-3xl bg-white p-6">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">ვაკანსიები</h2>
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{jobs.length}</span> შედეგი
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto no-scrollbar">
        {jobs.map((job) => (
          <JobCardCompact
            key={job.id}
            job={job}
            active={job.id === activeId}
            onClick={() => setActiveId(job.id)}
          />
        ))}
      </div>
    </section>
  )
}
