"use client"

import { ProfileControls } from "@/components/profile-controls"
import { JobFilters } from "@/components/job-filters"
import type { Filters } from "@/lib/filters"

interface DesktopSidebarProps {
  filters: Filters
  onChange: (filters: Filters) => void
  resultCount: number
}

export function DesktopSidebar({ filters, onChange, resultCount }: DesktopSidebarProps) {
  return (
    <aside className="flex min-h-0 w-full flex-col overflow-y-auto rounded-3xl bg-white p-6 no-scrollbar">
      <ProfileControls />

      <div className="my-6 border-t border-border" />

      <JobFilters
        filters={filters}
        onChange={onChange}
        resultCount={resultCount}
        variant="sidebar"
      />
    </aside>
  )
}
