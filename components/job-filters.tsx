"use client"

import { Search, SlidersHorizontal, X } from "lucide-react"
import { CATEGORIES, JOB_TYPES, WORKPLACES, LEVELS } from "@/lib/jobs"
import type { Filters } from "@/lib/filters"
import { DEFAULT_FILTERS } from "@/lib/filters"

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

interface JobFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  resultCount: number
  variant?: "sidebar" | "panel"
}

export function JobFilters({ filters, onChange, resultCount, variant = "sidebar" }: JobFiltersProps) {
  function toggle(key: "categories" | "types" | "workplaces" | "levels", value: string) {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  const activeCount =
    filters.categories.length +
    filters.types.length +
    filters.workplaces.length +
    filters.levels.length +
    (filters.minSalary > 0 ? 1 : 0) +
    (filters.query ? 1 : 0)

  return (
    <aside className="flex flex-col gap-8">
      {variant === "sidebar" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">ფილტრები</h2>
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
              გასუფთავება
            </button>
          )}
        </div>
      )}

      {variant === "panel" && activeCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            გასუფთავება
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="მოძებნე პოზიცია, კომპანია…"
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <FilterGroup title="კატეგორია">
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((cat) => (
            <CheckRow
              key={cat}
              label={LABELS[cat] ?? cat}
              checked={filters.categories.includes(cat)}
              onToggle={() => toggle("categories", cat)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="განაკვეთი">
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((t) => (
            <Pill key={t} label={LABELS[t] ?? t} active={filters.types.includes(t)} onClick={() => toggle("types", t)} />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="სამუშაო ფორმატი">
        <div className="flex flex-wrap gap-2">
          {WORKPLACES.map((w) => (
            <Pill
              key={w}
              label={LABELS[w] ?? w}
              active={filters.workplaces.includes(w)}
              onClick={() => toggle("workplaces", w)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="გამოცდილება">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <Pill key={l} label={LABELS[l] ?? l} active={filters.levels.includes(l)} onClick={() => toggle("levels", l)} />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="მინიმალური ხელფასი">
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min={0}
            max={9000}
            step={500}
            value={filters.minSalary}
            onChange={(e) => onChange({ ...filters, minSalary: Number(e.target.value) })}
            className="w-full cursor-pointer accent-primary"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filters.minSalary > 0 ? `$${filters.minSalary.toLocaleString()}/თვე` : "ნებისმიერი"}</span>
            <span>$9,000+</span>
          </div>
        </div>
      </FilterGroup>

      <div className="border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{resultCount}</span> ვაკანსია მოიძებნა
      </div>
    </aside>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-secondary"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-[5px] border transition-colors ${
          checked ? "border-primary bg-primary" : "border-border bg-card"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-primary-foreground" fill="none">
            <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={`text-sm ${checked ? "font-medium text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </button>
  )
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  )
}
