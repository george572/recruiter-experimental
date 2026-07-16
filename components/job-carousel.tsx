"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Job } from "@/lib/jobs"
import { JobCard } from "@/components/job-card"
import { JobCategoryChips } from "@/components/job-category-chips"
import {
  filterJobsByFeedCategory,
  getFeedSectionLabel,
  type JobFeedCategory,
} from "@/lib/job-feed"
import { jobColumnClass } from "@/lib/layout"
import { cn } from "@/lib/utils"

interface JobCarouselProps {
  jobs: Job[]
}

const MIN_SCALE = 0.9
const MOBILE_BREAKPOINT = 1024

export function JobCarousel({ jobs }: JobCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [feedCategory, setFeedCategory] = useState<JobFeedCategory>("recommended")
  const [activeIndex, setActiveIndex] = useState(0)
  const [scales, setScales] = useState<number[]>([])

  const visibleJobs = useMemo(
    () => filterJobsByFeedCategory(jobs, feedCategory),
    [jobs, feedCategory]
  )

  const update = useCallback(() => {
    const container = containerRef.current
    if (!container || visibleJobs.length === 0) return

    const scrollTop = container.scrollTop
    const viewportCenter = scrollTop + container.clientHeight / 2
    const range = container.clientHeight * 0.75
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT
    const minScale = isMobile ? 1 : MIN_SCALE
    let bestIndex = 0
    let bestDistance = Infinity

    const nextScales = visibleJobs.map((_, i) => {
      const el = itemRefs.current[i]
      if (!el) return 1

      const itemCenter = el.offsetTop + el.offsetHeight / 2
      const centerDistance = Math.abs(viewportCenter - itemCenter)

      if (centerDistance < bestDistance) {
        bestDistance = centerDistance
        bestIndex = i
      }

      if (isMobile) return 1

      const t = Math.min(1, Math.max(0, 1 - centerDistance / range))
      return minScale + t * (1 - minScale)
    })

    setScales(nextScales)
    setActiveIndex(bestIndex)
  }, [visibleJobs])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    container.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    update()

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      resizeObserver.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [update])

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "instant" })
    setActiveIndex(0)
    requestAnimationFrame(update)
  }, [visibleJobs, update])

  if (jobs.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border px-4 text-center">
          <p className="text-base font-medium text-foreground">ფილტრებს შესაბამისი ვაკანსია არ მოერგო</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            სცადე ძიების გაფართოება ან რამდენიმე ფილტრის გასუფთავება.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(jobColumnClass, "flex min-h-0 flex-1 flex-col gap-3 lg:gap-4")}>
      <JobCategoryChips value={feedCategory} onChange={setFeedCategory} />
      <h2 className="shrink-0 text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
        {getFeedSectionLabel(feedCategory)}
      </h2>
      {visibleJobs.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border px-4 text-center">
          <p className="text-base font-medium text-foreground">ამ კატეგორიაში ვაკანსია ჯერ არ არის</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            სცადე სხვა კატეგორიის არჩევა ან ფილტრების განახლება.
          </p>
        </div>
      ) : (
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="no-scrollbar h-full overflow-y-auto pb-6 lg:pb-8"
        >
          {visibleJobs.map((job, i) => (
            <div
              key={job.id}
              data-index={i}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className="pb-4 last:pb-0 lg:pb-5"
            >
              <div
                className="mx-auto flex w-full min-w-0 max-w-[720px] flex-col lg:max-w-[780px] lg:origin-center lg:will-change-transform xl:max-w-[820px]"
                style={
                  scales[i] !== undefined && scales[i] < 1
                    ? { transform: `scale(${scales[i]})` }
                    : undefined
                }
              >
                <JobCard job={job} active={i === activeIndex} />
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}
