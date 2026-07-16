"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  Filter,
  Gauge,
  Mail,
  Moon,
  RotateCcw,
  Search,
  Settings,
  Sun,
  ToggleLeft,
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

const THEME_KEY = "audience-theme"

const profileCards = [
  {
    label: "პროფილის ნახვები",
    value: "1,284",
    detail: "+18% ამ კვირაში",
    icon: Eye,
    accent: "bg-sky-500/10 text-sky-700",
  },
  {
    label: "მოწვევები",
    value: "42",
    detail: "8 პასუხს ელოდება",
    icon: Mail,
    accent: "bg-violet-500/10 text-violet-700",
  },
  {
    label: "ოპტიმიზაციის ქულა",
    value: "86%",
    detail: "ძლიერი პროფილი",
    icon: Gauge,
    accent: "bg-emerald-500/10 text-emerald-700",
  },
  {
    label: "პროფილის სტატუსი",
    value: "ღია",
    detail: "შეცვლა",
    icon: ToggleLeft,
    accent: "bg-amber-500/10 text-amber-700",
    action: true,
  },
  {
    label: "პარამეტრები",
    value: "მართვა",
    detail: "პროფილი და პრეფერენციები",
    icon: Settings,
    accent: "bg-slate-500/10 text-slate-700",
    action: true,
  },
] as const

const selectorButtonBase =
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium leading-none transition-colors"
const selectorButtonActive =
  "border-border bg-secondary text-foreground"
const selectorButtonIdle =
  "border-border/60 bg-card text-foreground hover:border-border hover:bg-secondary/50"

const panelClass =
  "rounded-3xl border border-border/60 bg-card shadow-[0_1px_3px_rgba(20,24,40,0.04)]"

const selectorCardClass =
  "rounded-2xl border border-border/60 bg-card px-3.5 py-3 shadow-[0_1px_3px_rgba(20,24,40,0.04)]"

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
    <div className="border-b border-border/60 py-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-3 text-left"
      >
        <span className="flex-1 text-[13.5px] font-semibold text-foreground">
          {title}{" "}
          <span className="font-medium text-muted-foreground">({count})</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
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
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-0.5 py-2">
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-md border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card"
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
      <span className="text-[13px] text-foreground/90">{label}</span>
    </label>
  )
}

export function AudienceOverview() {
  const [dark, setDark] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [selectedSource, setSelectedSource] = useState<SourceFilter>(null)
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
    return JOBS.filter((job) => {
      if (selectedSource && job.source !== selectedSource) return false
      if (!matchesSamushaoFilters(job, filters)) return false
      if (q) {
        const matchesQuery =
          job.company.toLowerCase().includes(q) ||
          job.title.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q)
        if (!matchesQuery) return false
      }
      return true
    })
  }, [selectedSource, query, filters])

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className={cn("relative h-full min-h-0 w-full overflow-hidden", dark && "dark")}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[480px] translate-x-1/4 translate-y-1/4 rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <div className="flex h-full min-h-0 w-full flex-col bg-background">
        <header className="relative flex shrink-0 items-center justify-between gap-4 px-5 py-3.5 sm:px-9">
          <a
            href="/"
            className="relative z-10 inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-primary px-3 transition-opacity hover:opacity-90"
          >
            <span className="text-sm font-bold text-primary-foreground">
              Recruiter.ge
            </span>
          </a>

          <div className="pointer-events-none absolute inset-x-0 flex justify-center px-5 sm:px-9">
            <div className="pointer-events-auto relative w-full max-w-md">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ძებნა"
                className="h-10 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-colors focus:border-foreground/20"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDark((prev) => !prev)}
            aria-label={dark ? "ღია რეჟიმი" : "მუქი რეჟიმი"}
            className="relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            {dark ? (
              <Sun className="size-4" strokeWidth={1.75} />
            ) : (
              <Moon className="size-4" strokeWidth={1.75} />
            )}
          </button>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1 gap-4 overflow-hidden px-4 pb-4 sm:gap-6 sm:px-6 sm:pb-6 lg:px-10">
          {/* Filters */}
          <aside className={cn("hidden w-[280px] shrink-0 flex-col overflow-hidden sm:flex", panelClass)}>
            <div className="flex items-center justify-between px-5 pb-2 pt-6">
              <Filter
                className="size-4 text-foreground"
                strokeWidth={1.75}
                aria-label="ფილტრები"
              />
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_SAMUSHAO_FILTERS)}
                disabled={activeFilterCount === 0}
                className={cn(
                  "inline-flex items-center gap-1 text-xs transition-colors",
                  activeFilterCount > 0
                    ? "text-muted-foreground hover:text-foreground"
                    : "cursor-default text-muted-foreground/40"
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
                  <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
                    <span>{filters.salaryMin.toLocaleString("ka-GE")} $</span>
                    <span>{filters.salaryMax.toLocaleString("ka-GE")} $</span>
                  </div>
                  <div className="relative h-6">
                    <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-secondary" />
                    <div
                      className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
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

          {/* Main column */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden sm:gap-6">
            {/* Greeting + profile stats — hidden for now */}
            {false && (
            <section className={cn("shrink-0 px-6 py-6 sm:px-8 sm:py-7", panelClass)}>
              <h1 className="text-[28px] font-bold leading-none tracking-tight text-foreground sm:text-[32px]">
                გამარჯობა, ნიკა
              </h1>

              <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
                {profileCards.map((card) => {
                  const Icon = card.icon
                  const isAction = "action" in card && card.action
                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-muted-foreground">
                            {card.label}
                          </p>
                          <p className="mt-1.5 text-lg font-semibold leading-none tracking-tight text-foreground">
                            {card.value}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full",
                            card.accent
                          )}
                        >
                          <Icon className="size-3.5" strokeWidth={2} />
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-2 truncate text-[11px] leading-none",
                          isAction
                            ? "font-medium text-foreground/70 group-hover:text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {card.detail}
                      </p>
                    </>
                  )
                  const className = cn(
                    "group relative overflow-hidden rounded-2xl bg-white px-3.5 py-3 text-left shadow-[0_1px_3px_rgba(20,24,40,0.04)] ring-1 ring-border/50 transition-all",
                    isAction &&
                      "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(20,24,40,0.06)] hover:ring-border"
                  )

                  if (isAction) {
                    return (
                      <button key={card.label} type="button" className={className}>
                        {content}
                      </button>
                    )
                  }

                  return (
                    <article key={card.label} className={className}>
                      {content}
                    </article>
                  )
                })}
              </div>
            </section>
            )}

            <section className={cn("shrink-0", selectorCardClass)}>
              <div>
                <div
                  className="flex flex-wrap gap-1.5"
                  role="tablist"
                  aria-label="ვაკანსიების წყაროები"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedSource === null}
                    onClick={() => setSelectedSource(null)}
                    className={cn(
                      selectorButtonBase,
                      selectedSource === null
                        ? selectorButtonActive
                        : selectorButtonIdle
                    )}
                  >
                    <span>ყველა</span>
                    <span
                      className={cn(
                        "tabular-nums text-[11px]",
                        selectedSource === null
                          ? "text-muted-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {JOBS.length}
                    </span>
                  </button>
                  {JOB_SOURCES.map((source) => {
                    const active = selectedSource === source.id
                    const count = JOBS.filter((job) => job.source === source.id).length
                    return (
                      <button
                        key={source.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSelectedSource(source.id)}
                        className={cn(
                          selectorButtonBase,
                          active ? selectorButtonActive : selectorButtonIdle
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center overflow-hidden rounded",
                            active ? "bg-card" : "bg-secondary"
                          )}
                        >
                          <Image
                            src={source.logo}
                            alt=""
                            width={16}
                            height={16}
                            className="size-3.5 object-contain"
                          />
                        </span>
                        <span>{source.label}</span>
                        <span className="tabular-nums text-[11px] text-muted-foreground">
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Jobs table */}
            <section
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                panelClass
              )}
            >
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto p-3 sm:p-4">
                <div className="flex min-h-0 min-w-[1020px] flex-1 flex-col">
                  <div
                    className={cn(
                      "mb-3 grid shrink-0 gap-3 rounded-xl px-4 py-3 text-[12.5px] text-muted-foreground sm:px-5",
                      tableGrid
                    )}
                  >
                    <span>კომპანია</span>
                    <span>პოზიცია</span>
                    <span>გამოქვეყნება / ვადა</span>
                    <span>ხელფასი</span>
                    <span>მდებარეობა</span>
                    <span>წყარო</span>
                    <span className="text-right">ნახვა</span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {filteredJobs.length === 0 ? (
                      <p className="py-10 text-center text-sm text-muted-foreground">
                        ამ ფილტრებით ვაკანსია არ მოიძებნა
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {filteredJobs.map((job) => {
                          const dates = jobDates(job)
                          return (
                            <li
                              key={job.id}
                              className={cn(
                                "grid items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-[0_1px_3px_rgba(20,24,40,0.04)] sm:px-5",
                                tableGrid
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
                                  <Image
                                    src={job.logo || "/placeholder.svg"}
                                    alt=""
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <p className="truncate text-[13.5px] font-semibold text-foreground">
                                  {job.company}
                                </p>
                              </div>

                              <p className="truncate text-[13.5px] font-medium text-foreground">
                                {job.title}
                              </p>

                              <div className="min-w-0 text-[12.5px] leading-5 text-muted-foreground">
                                <p className="truncate">{dates.uploaded}</p>
                                <p className="truncate text-muted-foreground/80">
                                  {dates.expires}
                                </p>
                              </div>

                              <p className="truncate text-[13px] tabular-nums text-foreground/90">
                                {formatSalary(job)}
                              </p>

                              <p className="truncate text-[13px] text-muted-foreground">
                                {job.location}
                              </p>

                              <p className="truncate text-[12.5px] font-semibold tracking-wide text-muted-foreground">
                                {sourceLabel(job.source)}
                              </p>

                              <div className="flex justify-end pl-1">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                                >
                                  ნახვა
                                  <ArrowRight className="size-3" strokeWidth={2.25} />
                                </button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
