"use client"

import { cn } from "@/lib/utils"

export type JobFeedCategory = "all" | "today" | "recommended" | "cv-match"

const CATEGORIES: { id: JobFeedCategory; label: string }[] = [
  { id: "all", label: "ყველა" },
  { id: "today", label: "დღევანდელი" },
  { id: "recommended", label: "შენთვის რეკომენდებული" },
  { id: "cv-match", label: "შენი CV ერგება" },
]

interface JobCategoryChipsProps {
  value: JobFeedCategory
  onChange: (value: JobFeedCategory) => void
}

export function JobCategoryChips({ value, onChange }: JobCategoryChipsProps) {
  return (
    <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto sm:gap-2.5">
      {CATEGORIES.map(({ id, label }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center rounded-full border bg-white px-5 py-2.5 text-[12px] font-medium leading-none tracking-[-0.01em] transition-all duration-200 sm:px-6 sm:py-3 sm:text-[13px]",
              active
                ? "border-primary/15 text-primary"
                : "border-border/80 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <span className="whitespace-nowrap">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
