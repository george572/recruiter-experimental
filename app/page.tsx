"use client"

import { useMemo, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { FilterSlidePanel } from "@/components/filter-slide-panel"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileSearchOverlay } from "@/components/mobile-search-overlay"
import { ProfileSlidePanel } from "@/components/profile-slide-panel"
import { StatisticsSlidePanel } from "@/components/statistics-slide-panel"
import { JobCarousel } from "@/components/job-carousel"
import { JOBS } from "@/lib/jobs"
import { contentShellClass } from "@/lib/layout"
import { DEFAULT_FILTERS, type Filters } from "@/lib/filters"

export default function Page() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [statisticsOpen, setStatisticsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const filteredJobs = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return JOBS.filter((job) => {
      if (q) {
        const haystack = `${job.title} ${job.company} ${job.tags.join(" ")} ${job.location}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (filters.categories.length && !filters.categories.includes(job.category)) return false
      if (filters.types.length && !filters.types.includes(job.type)) return false
      if (filters.workplaces.length && !filters.workplaces.includes(job.workplace)) return false
      if (filters.levels.length && !filters.levels.includes(job.level)) return false
      if (filters.minSalary > 0 && job.salaryMax < filters.minSalary) return false
      return true
    })
  }, [filters])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <MobileSearchOverlay
        open={searchOpen}
        onOpenChange={setSearchOpen}
        query={filters.query}
        onQueryChange={(query) => setFilters({ ...filters, query })}
        resultCount={filteredJobs.length}
      />
      <FilterSlidePanel
        filters={filters}
        onChange={setFilters}
        resultCount={filteredJobs.length}
        open={filterOpen}
        onOpenChange={setFilterOpen}
      />
      <StatisticsSlidePanel open={statisticsOpen} onOpenChange={setStatisticsOpen} />
      <ProfileSlidePanel open={profileOpen} onOpenChange={setProfileOpen} />

      <div className={contentShellClass}>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pt-5">
          <AppHeader />

          <div className="flex min-h-0 flex-1 flex-col">
            <JobCarousel jobs={filteredJobs} />
          </div>
        </main>

        <MobileBottomNav
          onOpenSearch={() => {
            setFilterOpen(false)
            setStatisticsOpen(false)
            setProfileOpen(false)
            setSearchOpen(true)
          }}
          onOpenFilters={() => {
            setSearchOpen(false)
            setStatisticsOpen(false)
            setProfileOpen(false)
            setFilterOpen(true)
          }}
          onOpenStatistics={() => {
            setSearchOpen(false)
            setFilterOpen(false)
            setProfileOpen(false)
            setStatisticsOpen(true)
          }}
          onOpenProfile={() => {
            setSearchOpen(false)
            setFilterOpen(false)
            setStatisticsOpen(false)
            setProfileOpen(true)
          }}
          searchOpen={searchOpen}
          statisticsOpen={statisticsOpen}
          profileOpen={profileOpen}
        />
      </div>
    </div>
  )
}
