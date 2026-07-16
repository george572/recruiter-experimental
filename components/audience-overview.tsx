"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Check,
  ChevronDown,
  Moon,
  RotateCcw,
  Search,
  Send,
  Sun,
} from "lucide-react"
import Image from "next/image"
import { JOB_SOURCES, JOBS, type Job, type JobSource } from "@/lib/jobs"
import {
  DEFAULT_SAMUSHAO_FILTERS,
  SALARY_MAX,
  SALARY_MIN,
  SAMUSHAO_CATEGORIES,
  SAMUSHAO_CITIES,
  SAMUSHAO_EXPERIENCE,
  SAMUSHAO_SCHEDULES,
  SAMUSHAO_WORK_MODES,
  countActiveSamushaoFilters,
  matchesSamushaoFilters,
  toggleListItem,
  type SamushaoFilters,
} from "@/lib/samushao-filters"
import { cn } from "@/lib/utils"

type SourceFilter = JobSource | null
type SectionFilter = "recommended" | "cv-fit" | "highest-paid" | "popular"

const THEME_KEY = "audience-theme"

const SECTION_CHIPS: { id: SectionFilter; label: string }[] = [
  { id: "recommended", label: "შენთვის რეკომენდებული" },
  { id: "cv-fit", label: "შენი CV ერგება" },
  { id: "highest-paid", label: "ყველაზე მაღალანაზღაურებადი" },
  { id: "popular", label: "ყველაზე პოპულარული" },
]

const chipBase =
  "inline-flex shrink-0 cursor-pointer items-center rounded-full border px-4 py-2 text-[12px] font-medium leading-none tracking-[-0.01em] transition-all duration-200"
const chipActive =
  "border-[#111] bg-[#111] text-white dark:border-[#7eb6ff] dark:bg-[#1a4a8a] dark:text-white"
const chipIdle =
  "border-[#e8e8e8] bg-white text-[#52525b] hover:border-[#d4d4d8] hover:text-[#111] dark:border-[#243552] dark:bg-transparent dark:text-[#8b9bb8] dark:hover:border-[#3a5070] dark:hover:text-[#e8eef8]"

const EXPIRY_WINDOW_DAYS = 30

const tableGrid =
  "grid-cols-[minmax(130px,1fr)_minmax(150px,1.2fr)_minmax(110px,0.85fr)_minmax(110px,0.85fr)_minmax(110px,0.9fr)_minmax(100px,0.75fr)_108px]"

function formatDate(daysAgo: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatSalary(job: Job) {
  return `${job.salaryMin.toLocaleString("ka-GE")} – ${job.salaryMax.toLocaleString("ka-GE")} ${job.currency}`
}

function sourceLabel(source: JobSource) {
  return JOB_SOURCES.find((item) => item.id === source)?.label ?? source.toUpperCase()
}

function jobDates(job: Job) {
  return {
    uploaded: formatDate(job.postedDaysAgo),
    expires: formatDate(job.postedDaysAgo - EXPIRY_WINDOW_DAYS),
  }
}

function FilterAccordion({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string
  count: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="border-b border-[#ececec] py-1 dark:border-[#1e2d4a]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-3 text-left"
      >
        <span className="flex-1 text-[13.5px] font-semibold text-[#111] dark:text-[#e8eef8]">
          {title}{" "}
          <span className="font-medium text-[#a1a1aa] dark:text-[#6b7f9e]">({count})</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-[#a1a1aa] transition-transform duration-200",
            open && "rotate-180"
          )}
          strokeWidth={1.75}
        />
      </button>
      {open ? <div className="space-y-1 pb-4">{children}</div> : null}
    </div>
  )
}

function FilterCheck({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-0.5 py-2">
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          checked
            ? "border-[#111] bg-[#111] text-white dark:border-[#7eb6ff] dark:bg-[#1a4a8a] dark:text-white"
            : "border-[#d4d4d8] bg-white dark:border-[#3a5070] dark:bg-transparent"
        )}
      >
        {checked ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-[13px] text-[#3f3f46] dark:text-[#b8c5d9]">{label}</span>
    </label>
  )
}

export function AudienceOverview() {
  const [dark, setDark] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [selectedSource, setSelectedSource] = useState<SourceFilter>(null)
  const [selectedSection, setSelectedSection] = useState<SectionFilter | null>(null)
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<SamushaoFilters>(DEFAULT_SAMUSHAO_FILTERS)
  const [openSections, setOpenSections] = useState({
    categories: true,
    salary: true,
    experience: true,
    schedule: true,
    workMode: true,
    cities: true,
  })

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setDark(stored === "dark" || (!stored && prefersDark))
    setThemeReady(true)
  }, [])

  useEffect(() => {
    if (!themeReady) return
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light")
  }, [dark, themeReady])

  const activeFilterCount = countActiveSamushaoFilters(filters)
  const salaryActive =
    filters.salaryMin > SALARY_MIN || filters.salaryMax < SALARY_MAX ? 1 : 0

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase()
    let jobs = JOBS.filter((job) => {
      if (selectedSource && job.source !== selectedSource) return false
      if (!matchesSamushaoFilters(job, filters)) return false
      if (q) {
        const matchesQuery =
          job.company.toLowerCase().includes(q) ||
          job.title.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q)
        if (!matchesQuery) return false
      }
      if (selectedSection === "recommended") {
        return Boolean(job.hrActive) || job.postedDaysAgo <= 3
      }
      if (selectedSection === "cv-fit") {
        return !job.cvNotRequired
      }
      return true
    })

    if (selectedSection === "highest-paid") {
      jobs = [...jobs].sort((a, b) => b.salaryMax - a.salaryMax)
    } else if (selectedSection === "popular") {
      jobs = [...jobs].sort((a, b) => b.applicants - a.applicants)
    }

    return jobs
  }, [selectedSource, selectedSection, query, filters])

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className={cn("h-full min-h-0 w-full", dark && "dark")}>
      <div className="flex h-full min-h-0 w-full flex-col bg-[#f0f0f2] dark:bg-[#070d1a]">
        <header className="relative flex shrink-0 items-center justify-between gap-4 px-5 py-3.5 sm:px-9">
          <a
            href="/"
            className="relative z-10 inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-[#111] px-3 transition-opacity hover:opacity-90 dark:bg-[#7eb6ff]"
          >
            <span className="text-sm font-bold text-white dark:text-[#070d1a]">
              Recruiter.ge
            </span>
          </a>

          <div className="pointer-events-none absolute inset-x-0 flex justify-center px-5 sm:px-9">
            <div className="pointer-events-auto relative w-full max-w-md">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#a1a1aa] dark:text-[#6b7f9e]"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ძებნა"
                className="h-9 w-full rounded-xl border border-transparent bg-white pl-10 pr-4 text-[14px] text-[#111] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-[#a1a1aa] transition-shadow focus:border-[#d4d4d8] focus:ring-2 focus:ring-white/80 dark:border-[#243552] dark:bg-[#111c33] dark:text-[#e8eef8] dark:shadow-[0_1px_3px_rgba(0,10,40,0.45)] dark:placeholder:text-[#6b7f9e] dark:focus:border-[#3a5070] dark:focus:ring-[#0d1a30]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDark((prev) => !prev)}
            aria-label={dark ? "ღია რეჟიმი" : "მუქი რეჟიმი"}
            className="relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-transparent bg-white text-[#52525b] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:text-[#111] dark:border-[#243552] dark:bg-[#111c33] dark:text-[#8b9bb8] dark:shadow-[0_1px_3px_rgba(0,10,40,0.45)] dark:hover:text-[#e8eef8]"
          >
            {dark ? (
              <Sun className="size-4" strokeWidth={1.75} />
            ) : (
              <Moon className="size-4" strokeWidth={1.75} />
            )}
          </button>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1 gap-4 overflow-hidden px-4 pb-4 sm:px-6 sm:pb-6">
          {/* Sidebar filters */}
          <aside className="hidden w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] dark:bg-[#111c33] dark:shadow-[0_1px_3px_rgba(0,10,40,0.35),0_8px_24px_rgba(0,15,50,0.45)] sm:flex">
            <div className="flex items-center justify-between px-5 pb-2 pt-6">
              <h2 className="text-[14px] font-semibold text-[#111] dark:text-[#e8eef8]">
                ფილტრები
              </h2>
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_SAMUSHAO_FILTERS)}
                disabled={activeFilterCount === 0}
                className={cn(
                  "inline-flex items-center gap-1 text-[12px] transition-colors",
                  activeFilterCount > 0
                    ? "text-[#71717a] hover:text-[#111] dark:text-[#8b9bb8] dark:hover:text-[#e8eef8]"
                    : "cursor-default text-[#d4d4d8] dark:text-[#3a5070]"
                )}
              >
                <RotateCcw className="size-3" strokeWidth={1.75} />
                გასუფთავება
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 [scrollbar-width:thin]">
              <FilterAccordion
                title="კატეგორია"
                count={filters.categories.length}
                open={openSections.categories}
                onToggle={() => toggleSection("categories")}
              >
                <div className="max-h-56 space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
                  {SAMUSHAO_CATEGORIES.map((category) => (
                    <FilterCheck
                      key={category}
                      label={category}
                      checked={filters.categories.includes(category)}
                      onChange={() =>
                        setFilters((prev) => ({
                          ...prev,
                          categories: toggleListItem(prev.categories, category),
                        }))
                      }
                    />
                  ))}
                </div>
              </FilterAccordion>

              <FilterAccordion
                title="ანაზღაურება"
                count={salaryActive}
                open={openSections.salary}
                onToggle={() => toggleSection("salary")}
              >
                <div className="space-y-4 px-0.5 pt-1">
                  <div className="flex items-center justify-between text-[12px] tabular-nums text-[#71717a] dark:text-[#8b9bb8]">
                    <span>{filters.salaryMin.toLocaleString("ka-GE")} $</span>
                    <span>{filters.salaryMax.toLocaleString("ka-GE")} $</span>
                  </div>
                  <div className="relative h-6">
                    <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#e8e8e8] dark:bg-[#1e2d4a]" />
                    <div
                      className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#111] dark:bg-[#7eb6ff]"
                      style={{
                        left: `${(filters.salaryMin / SALARY_MAX) * 100}%`,
                        right: `${100 - (filters.salaryMax / SALARY_MAX) * 100}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={SALARY_MIN}
                      max={SALARY_MAX}
                      step={100}
                      value={filters.salaryMin}
                      onChange={(e) => {
                        const next = Number(e.target.value)
                        setFilters((prev) => ({
                          ...prev,
                          salaryMin: Math.min(next, prev.salaryMax - 100),
                        }))
                      }}
                      className="salary-range absolute inset-0 z-[2] h-full w-full cursor-pointer appearance-none bg-transparent"
                      aria-label="ანაზღაურების მინიმუმი"
                    />
                    <input
                      type="range"
                      min={SALARY_MIN}
                      max={SALARY_MAX}
                      step={100}
                      value={filters.salaryMax}
                      onChange={(e) => {
                        const next = Number(e.target.value)
                        setFilters((prev) => ({
                          ...prev,
                          salaryMax: Math.max(next, prev.salaryMin + 100),
                        }))
                      }}
                      className="salary-range absolute inset-0 z-[3] h-full w-full cursor-pointer appearance-none bg-transparent"
                      aria-label="ანაზღაურების მაქსიმუმი"
                    />
                  </div>
                </div>
              </FilterAccordion>

              <FilterAccordion
                title="გამოცდილება"
                count={filters.experience.length}
                open={openSections.experience}
                onToggle={() => toggleSection("experience")}
              >
                {SAMUSHAO_EXPERIENCE.map((item) => (
                  <FilterCheck
                    key={item}
                    label={item}
                    checked={filters.experience.includes(item)}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        experience: toggleListItem(prev.experience, item),
                      }))
                    }
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="განაკვეთი"
                count={filters.schedules.length}
                open={openSections.schedule}
                onToggle={() => toggleSection("schedule")}
              >
                {SAMUSHAO_SCHEDULES.map((item) => (
                  <FilterCheck
                    key={item}
                    label={item}
                    checked={filters.schedules.includes(item)}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        schedules: toggleListItem(prev.schedules, item),
                      }))
                    }
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="სამუშაო რეჟიმი"
                count={filters.workModes.length}
                open={openSections.workMode}
                onToggle={() => toggleSection("workMode")}
              >
                {SAMUSHAO_WORK_MODES.map((item) => (
                  <FilterCheck
                    key={item}
                    label={item}
                    checked={filters.workModes.includes(item)}
                    onChange={() =>
                      setFilters((prev) => ({
                        ...prev,
                        workModes: toggleListItem(prev.workModes, item),
                      }))
                    }
                  />
                ))}
              </FilterAccordion>

              <FilterAccordion
                title="ქალაქი"
                count={filters.cities.length}
                open={openSections.cities}
                onToggle={() => toggleSection("cities")}
              >
                <div className="max-h-48 space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
                  {SAMUSHAO_CITIES.map((city) => (
                    <FilterCheck
                      key={city}
                      label={city}
                      checked={filters.cities.includes(city)}
                      onChange={() =>
                        setFilters((prev) => ({
                          ...prev,
                          cities: toggleListItem(prev.cities, city),
                        }))
                      }
                    />
                  ))}
                </div>
              </FilterAccordion>
            </div>
          </aside>

          {/* Main */}
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] dark:bg-[#111c33] dark:shadow-[0_1px_3px_rgba(0,10,40,0.35),0_8px_24px_rgba(0,15,50,0.45)]">
            <div className="shrink-0 space-y-5 px-6 pt-7 sm:px-9 sm:pt-8">
              <h1 className="text-[28px] font-bold leading-none tracking-tight text-[#111] dark:text-[#e8eef8] sm:text-[32px]">
                გამარჯობა, ნიკა
              </h1>

              {/* Job sources */}
              <div
                className="flex max-w-full flex-wrap items-center gap-2"
                role="tablist"
                aria-label="ვაკანსიების წყაროები"
              >
                {JOB_SOURCES.map((source) => {
                  const active = selectedSource === source.id
                  const count = JOBS.filter((job) => job.source === source.id).length
                  return (
                    <button
                      key={source.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() =>
                        setSelectedSource((prev) =>
                          prev === source.id ? null : source.id
                        )
                      }
                      className={cn(
                        chipBase,
                        "gap-1.5",
                        active ? chipActive : chipIdle
                      )}
                    >
                      <span>{source.label}</span>
                      <span
                        className={cn(
                          "tabular-nums text-[11px]",
                          active
                            ? "text-white"
                            : "text-[#a1a1aa] dark:text-[#6b7f9e]"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Section chips */}
              <div
                className="flex max-w-full flex-wrap items-center gap-2"
                role="tablist"
                aria-label="სექციები"
              >
                {SECTION_CHIPS.map((section) => {
                  const active = selectedSection === section.id
                  return (
                    <button
                      key={section.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() =>
                        setSelectedSection((prev) =>
                          prev === section.id ? null : section.id
                        )
                      }
                      className={cn(chipBase, active ? chipActive : chipIdle)}
                    >
                      {section.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Jobs table */}
            <div className="mt-6 min-h-0 min-w-0 flex-1 overflow-auto px-6 pb-7 sm:px-9 sm:pb-8">
              <div className="min-w-[1020px]">
                <div
                  className={cn(
                    "sticky top-0 z-10 grid gap-3 border-b border-[#f0f0f0] bg-white pb-3 pt-1 text-[12.5px] text-[#a1a1aa] dark:border-[#1e2d4a] dark:bg-[#111c33] dark:text-[#6b7f9e]",
                    tableGrid
                  )}
                >
                  <span>კომპანია</span>
                  <span>პოზიცია</span>
                  <span>გამოქვეყნება / ვადა</span>
                  <span>ხელფასი</span>
                  <span>მდებარეობა</span>
                  <span>წყარო</span>
                  <span className="sticky right-0 bg-white text-right dark:bg-[#111c33]">
                    გაგზავნა
                  </span>
                </div>

                {filteredJobs.length === 0 ? (
                  <p className="py-10 text-center text-[14px] text-[#a1a1aa]">
                    ამ ფილტრებით ვაკანსია არ მოიძებნა
                  </p>
                ) : (
                  <ul>
                    {filteredJobs.map((job) => {
                      const dates = jobDates(job)
                      return (
                        <li
                          key={job.id}
                          className={cn(
                            "grid items-center gap-3 border-b border-[#f7f7f7] py-3.5 last:border-b-0 dark:border-[#1a2740]",
                            tableGrid
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f5f5f5] dark:bg-[#0d1628]">
                              <Image
                                src={job.logo || "/placeholder.svg"}
                                alt=""
                                width={36}
                                height={36}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <p className="truncate text-[13.5px] font-semibold text-[#111] dark:text-[#e8eef8]">
                              {job.company}
                            </p>
                          </div>

                          <p className="truncate text-[13.5px] font-medium text-[#111] dark:text-[#dce6f5]">
                            {job.title}
                          </p>

                          <div className="min-w-0 text-[12.5px] leading-5 text-[#52525b] dark:text-[#8b9bb8]">
                            <p className="truncate">{dates.uploaded}</p>
                            <p className="truncate text-[#a1a1aa] dark:text-[#6b7f9e]">
                              {dates.expires}
                            </p>
                          </div>

                          <p className="truncate text-[13px] tabular-nums text-[#3f3f46] dark:text-[#b8c5d9]">
                            {formatSalary(job)}
                          </p>

                          <p className="truncate text-[13px] text-[#52525b] dark:text-[#8b9bb8]">
                            {job.location}
                          </p>

                          <p className="truncate text-[12.5px] font-semibold tracking-wide text-[#52525b] dark:text-[#8b9bb8]">
                            {sourceLabel(job.source)}
                          </p>

                          <div className="sticky right-0 flex justify-end bg-white pl-1 dark:bg-[#111c33]">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#111] px-3 py-1.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-85 dark:bg-[#1a4a8a] dark:text-white dark:hover:opacity-90"
                            >
                              <Send className="size-3" strokeWidth={2.25} />
                              გაგზავნა
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
