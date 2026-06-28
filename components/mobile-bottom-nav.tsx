"use client"

import { SlidersHorizontal, Search, User, BarChart3 } from "lucide-react"
import { jobColumnClass } from "@/lib/layout"
import { cn } from "@/lib/utils"

interface MobileBottomNavProps {
  onOpenSearch: () => void
  onOpenFilters: () => void
  onOpenStatistics: () => void
  onOpenProfile: () => void
  searchOpen?: boolean
  statisticsOpen?: boolean
  profileOpen?: boolean
}

const itemClass =
  "flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 overflow-visible px-0.5 py-2 transition-colors active:bg-secondary lg:gap-1 lg:rounded-2xl lg:px-2 lg:py-2.5 lg:hover:bg-secondary"

const labelClass =
  "block max-w-full px-0.5 text-center text-[9px] font-medium leading-[1.35] lg:text-[10px] lg:leading-[1.35] xl:text-xs"

export function MobileBottomNav({
  onOpenSearch,
  onOpenFilters,
  onOpenStatistics,
  onOpenProfile,
  searchOpen = false,
  statisticsOpen = false,
  profileOpen = false,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="მთავარი ნავიგაცია"
      className="shrink-0 pb-[max(12px,env(safe-area-inset-bottom))] lg:pb-4"
    >
      <div
        className={cn(
          jobColumnClass,
          "flex items-center justify-between rounded-full bg-white px-1 py-2 shadow-[0_8px_32px_-10px_rgba(20,24,40,0.14)] lg:px-2 lg:py-2.5 lg:shadow-[0_12px_40px_-12px_rgba(20,24,40,0.16)]"
        )}
      >
        <button
          type="button"
          onClick={onOpenSearch}
          aria-expanded={searchOpen}
          className={`${itemClass} ${searchOpen ? "text-foreground" : "text-muted-foreground"}`}
        >
          <Search className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" aria-hidden="true" />
          <span className={labelClass}>ძებნა</span>
        </button>

        <button
          type="button"
          onClick={onOpenFilters}
          className={`${itemClass} text-foreground`}
        >
          <SlidersHorizontal className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" aria-hidden="true" />
          <span className={labelClass}>ფილტრები</span>
        </button>

        <button
          type="button"
          onClick={onOpenStatistics}
          aria-expanded={statisticsOpen}
          className={`${itemClass} ${statisticsOpen ? "text-foreground" : "text-muted-foreground"}`}
        >
          <BarChart3 className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" aria-hidden="true" />
          <span className={labelClass}>სტატისტიკები</span>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          aria-expanded={profileOpen}
          className={`${itemClass} ${profileOpen ? "text-foreground" : "text-muted-foreground"}`}
        >
          <User className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" aria-hidden="true" />
          <span className={labelClass}>პროფილი</span>
        </button>
      </div>
    </nav>
  )
}
