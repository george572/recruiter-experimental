"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
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
  SlidersHorizontal,
  Sun,
  ToggleLeft,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { JobCardCompact } from "@/components/job-card-compact"
import { ListErrorBoundary } from "@/components/list-error-boundary"
import { formatDaysAgoDate, formatInt } from "@/lib/format"
import { JOB_SOURCES, formatJobSalary, type Job, type JobSource } from "@/lib/jobs"
import {
  JOB_SOURCE_TO_API,
  SOURCE_KEY_TO_JOB_SOURCE,
  type ScrapedFilterOption,
  type ScrapedSourceCount,
} from "@/lib/scrape-jobs"
import {
  DEFAULT_SAMUSHAO_FILTERS,
  SALARY_MAX,
  SALARY_MIN,
  SAMUSHAO_CITIES,
  SAMUSHAO_EXPERIENCE,
  SAMUSHAO_SCHEDULES,
  SAMUSHAO_WORK_MODES,
  countActiveSamushaoFilters,
  matchesSamushaoFilters,
  toggleListItem,
  type SamushaoFilters,
} from "@/lib/samushao-filters"
import type { CategoryCount } from "@/lib/category-counts"
import { cn } from "@/lib/utils"

type SourceFilter = JobSource | null

const THEME_KEY = "audience-theme"
const PAGE_SIZE = 50

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
  "border-foreground bg-foreground text-background"
const selectorButtonIdle =
  "border-border/60 bg-card text-foreground hover:border-border hover:bg-secondary/50"

const panelClass =
  "rounded-3xl border border-border/60 bg-card shadow-[0_1px_3px_rgba(20,24,40,0.04)]"

const selectorCardClass =
  "rounded-2xl border border-border/60 bg-card px-3.5 py-3 shadow-[0_1px_3px_rgba(20,24,40,0.04)]"

const EXPIRY_WINDOW_DAYS = 30

const tableGrid =
  "grid-cols-[minmax(130px,1fr)_minmax(150px,1.2fr)_minmax(110px,0.85fr)_minmax(110px,0.85fr)_minmax(110px,0.9fr)_minmax(100px,0.75fr)_108px]"

function formatSalary(job: Job) {
  try {
    return formatJobSalary(job)
  } catch {
    return "შეთანხმებით"
  }
}

function sourceLabel(source: JobSource) {
  return JOB_SOURCES.find((item) => item.id === source)?.label ?? source.toUpperCase()
}

function jobDates(job: Job, nowMs?: number) {
  return {
    uploaded: formatDaysAgoDate(job.postedDaysAgo, nowMs),
    expires: formatDaysAgoDate(job.postedDaysAgo - EXPIRY_WINDOW_DAYS, nowMs),
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
  count,
  checked,
  onChange,
}: {
  label: string
  count?: number
  checked: boolean
  onChange: () => void
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-3 rounded-lg px-0.5 py-2"
      suppressHydrationWarning
    >
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
      <span className="min-w-0 flex-1 text-[13px] text-foreground/90">{label}</span>
      {typeof count === "number" ? (
        <span className="shrink-0 tabular-nums text-[12px] text-muted-foreground">
          {formatInt(count)}
        </span>
      ) : null}
    </label>
  )
}

type OpenSections = {
  categories: boolean
  salary: boolean
  experience: boolean
  schedule: boolean
  workMode: boolean
  cities: boolean
}

function AudienceFiltersBody({
  filters,
  setFilters,
  openSections,
  toggleSection,
  salaryActive,
  categories = [],
  cities = [],
}: {
  filters: SamushaoFilters
  setFilters: Dispatch<SetStateAction<SamushaoFilters>>
  openSections: OpenSections
  toggleSection: (key: keyof OpenSections) => void
  salaryActive: number
  categories?: CategoryCount[]
  cities?: ScrapedFilterOption[]
}) {
  const safeCategories = categories ?? []
  const safeCities = cities ?? []
  const cityOptions = safeCities.length
    ? safeCities.map((c) => c.name)
    : [...SAMUSHAO_CITIES]

  return (
    <>
      <FilterAccordion
        title="კატეგორია"
        count={filters.categories.length}
        open={openSections.categories}
        onToggle={() => toggleSection("categories")}
      >
        <div className="max-h-56 space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
          {safeCategories.map((category) => (
            <FilterCheck
              key={category.category_id}
              label={category.name}
              count={category.count}
              checked={filters.categories.includes(category.name)}
              onChange={() =>
                setFilters((prev) => ({
                  ...prev,
                  categories: toggleListItem(prev.categories, category.name),
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
            <span>{formatInt(filters.salaryMin)} $</span>
            <span>{formatInt(filters.salaryMax)} $</span>
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
          {cityOptions.map((city) => {
            const count = safeCities.find((c) => c.name === city)?.count
            return (
              <FilterCheck
                key={city}
                label={city}
                count={count}
                checked={filters.cities.includes(city)}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    cities: toggleListItem(prev.cities, city),
                  }))
                }
              />
            )
          })}
        </div>
      </FilterAccordion>
    </>
  )
}

function AudienceFilterSlidePanel({
  open,
  onOpenChange,
  filters,
  setFilters,
  openSections,
  toggleSection,
  salaryActive,
  activeFilterCount,
  categories = [],
  cities = [],
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: SamushaoFilters
  setFilters: Dispatch<SetStateAction<SamushaoFilters>>
  openSections: OpenSections
  toggleSection: (key: keyof OpenSections) => void
  salaryActive: number
  activeFilterCount: number
  categories?: CategoryCount[]
  cities?: ScrapedFilterOption[]
}) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label="ფილტრების დახურვა"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        className={cn(
          "fixed inset-0 z-[55] cursor-default bg-foreground/25 backdrop-blur-md transition-opacity duration-500 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => onOpenChange(false)}
      />

      <aside
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-[10px] bottom-0 z-[60] flex h-[95%] flex-col rounded-t-3xl bg-card shadow-[0_-8px_40px_-12px_rgba(20,24,40,0.18),0_24px_64px_-24px_rgba(20,24,40,0.35)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
          open ? "translate-y-0" : "pointer-events-none translate-y-full"
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 p-8">
          <h2 className="text-sm font-semibold text-foreground">ფილტრები</h2>
          <div className="flex items-center gap-2">
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
            <button
              type="button"
              aria-label="ფილტრების დახურვა"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-2 no-scrollbar">
          <AudienceFiltersBody
            filters={filters}
            setFilters={setFilters}
            openSections={openSections}
            toggleSection={toggleSection}
            salaryActive={salaryActive}
            categories={categories}
            cities={cities}
          />
        </div>
      </aside>
    </>
  )
}

export function AudienceOverview({
  initialJobs = [],
  initialTotal = 0,
  initialHasMore = false,
  initialNextOffset = null,
  categories = [],
  sources = [],
  cities = [],
  initialFilters,
  renderNowMs,
}: {
  initialJobs?: Job[]
  initialTotal?: number
  initialHasMore?: boolean
  initialNextOffset?: number | null
  categories?: CategoryCount[]
  sources?: ScrapedSourceCount[]
  cities?: ScrapedFilterOption[]
  /** Preset filters for programmatic landing pages (e.g. category / city). */
  initialFilters?: SamushaoFilters
  /** Fixed clock from the server so date labels hydrate cleanly. */
  renderNowMs?: number
}) {
  const router = useRouter()
  const nowMs = renderNowMs ?? 0
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [total, setTotal] = useState(initialTotal || initialJobs.length)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [nextOffset, setNextOffset] = useState<number | null>(
    initialNextOffset ?? (initialHasMore ? initialJobs.length : null)
  )
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingReset, setLoadingReset] = useState(false)
  const loadingLock = useRef(false)
  const fetchGen = useRef(0)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const desktopScrollRef = useRef<HTMLDivElement>(null)
  const [dark, setDark] = useState(false)
  const [themeReady, setThemeReady] = useState(false)
  const [selectedSource, setSelectedSource] = useState<SourceFilter>(null)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState<SamushaoFilters>(
    initialFilters ?? DEFAULT_SAMUSHAO_FILTERS
  )
  const [openSections, setOpenSections] = useState<OpenSections>({
    categories: true,
    salary: true,
    experience: true,
    schedule: true,
    workMode: true,
    cities: true,
  })

  const sourceCounts = useMemo(() => {
    const map = new Map<JobSource, number>()
    for (const row of sources) {
      const key = SOURCE_KEY_TO_JOB_SOURCE[row.source]
      if (key) map.set(key, row.count)
    }
    return map
  }, [sources])

  // Total jobs on the whole platform — must stay constant regardless of the
  // active filters/source/search. Prefer the sum of the (unfiltered) per-source
  // counts so the "All" chip always equals the sum of the source chips; fall
  // back to the initial unfiltered total when sources aren't available.
  const platformTotal = useMemo(() => {
    if (sources.length > 0) {
      return sources.reduce((sum, row) => sum + (Number(row.count) || 0), 0)
    }
    return initialTotal || initialJobs.length
  }, [sources, initialTotal, initialJobs.length])

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

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [query])

  const fetchPage = useCallback(
    async (offset: number, replace: boolean) => {
      // Replace (filter/source/query change) always wins over an in-flight loadMore.
      if (!replace && loadingLock.current) return
      const requestId = ++fetchGen.current
      loadingLock.current = true
      if (replace) setLoadingReset(true)
      else setLoadingMore(true)

      try {
        const params = new URLSearchParams()
        params.set("limit", String(PAGE_SIZE))
        params.set("offset", String(offset))
        params.set("order", "round_robin")

        if (selectedSource) {
          const apiSource = JOB_SOURCE_TO_API[selectedSource]
          if (apiSource) params.set("source", apiSource)
        }
        if (debouncedQuery) params.set("q", debouncedQuery)

        if (filters.categories.length === 1) {
          const cat = categories.find((c) => c.name === filters.categories[0])
          if (cat) params.set("category_id", String(cat.category_id))
        }
        if (filters.cities.length === 1) {
          params.set("city", filters.cities[0])
        }
        if (filters.salaryMin > SALARY_MIN) {
          params.set("salary_min", String(filters.salaryMin))
        }
        if (filters.salaryMax < SALARY_MAX) {
          params.set("salary_max", String(filters.salaryMax))
        }
        if (filters.schedules.length === 1) {
          params.set(
            "employment_type",
            filters.schedules[0] === "ნახევარი განაკვეთი" ? "part" : "full"
          )
        }

        const res = await fetch(`/api/jobs?${params}`)
        if (!res.ok) throw new Error(`jobs page failed: ${res.status}`)
        const data = (await res.json()) as {
          jobs?: Job[]
          total?: number
          hasMore?: boolean
          has_more?: boolean
          next_offset?: number | null
        }
        // A newer replace/load superseded this request — ignore stale payload.
        if (requestId !== fetchGen.current) return

        const nextJobs = Array.isArray(data.jobs) ? data.jobs : []
        const nextTotal = Number(data.total) || 0
        const more = Boolean(data.has_more ?? data.hasMore) && nextJobs.length > 0
        setTotal(nextTotal)
        setHasMore(more)
        setNextOffset(
          more
            ? data.next_offset != null
              ? Number(data.next_offset)
              : offset + nextJobs.length
            : null
        )
        setJobs((prev) => {
          if (replace) return nextJobs
          if (nextJobs.length === 0) return prev
          const seen = new Set(prev.map((j) => j.id))
          return [...prev, ...nextJobs.filter((j) => !seen.has(j.id))]
        })
        // Clear loading flags immediately on success (don't wait for finally),
        // so a superseded in-flight request can't leave the UI stuck spinning.
        if (replace) {
          setLoadingReset(false)
          setLoadingMore(false)
          loadingLock.current = false
          requestAnimationFrame(() => {
            mobileScrollRef.current?.scrollTo({ top: 0 })
            desktopScrollRef.current?.scrollTo({ top: 0 })
          })
        }
      } catch (err) {
        if (requestId !== fetchGen.current) return
        console.error("[audience] load page failed:", err)
        setHasMore(false)
        setNextOffset(null)
      } finally {
        // Always release locks for the latest request; also heal a stuck loading
        // flag if a superseded request left loadingReset true.
        if (requestId === fetchGen.current) {
          loadingLock.current = false
          setLoadingMore(false)
          setLoadingReset(false)
        }
      }
    },
    [selectedSource, debouncedQuery, filters, categories]
  )

  const serverFilterKey = useMemo(
    () =>
      JSON.stringify({
        categories: filters.categories,
        cities: filters.cities,
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
        schedules: filters.schedules,
      }),
    [
      filters.categories,
      filters.cities,
      filters.salaryMin,
      filters.salaryMax,
      filters.schedules,
    ]
  )

  // Keep a stable ref so the filter effect does not re-fire when fetchPage identity changes.
  const fetchPageRef = useRef(fetchPage)
  fetchPageRef.current = fetchPage

  const didMountFilters = useRef(false)
  useEffect(() => {
    if (!didMountFilters.current) {
      didMountFilters.current = true
      return
    }
    void fetchPageRef.current(0, true)
  }, [selectedSource, debouncedQuery, serverFilterKey])

  // Close the mobile filter sheet once a filter is applied so results are visible.
  const prevFilterKey = useRef(serverFilterKey)
  useEffect(() => {
    if (prevFilterKey.current === serverFilterKey) return
    prevFilterKey.current = serverFilterKey
    setFilterOpen(false)
  }, [serverFilterKey])
  const loadMore = useCallback(() => {
    if (!hasMore || loadingLock.current || loadingMore || loadingReset) return
    const offset = nextOffset ?? jobs.length
    void fetchPage(offset, false)
  }, [fetchPage, hasMore, jobs.length, loadingMore, loadingReset, nextOffset])

  useEffect(() => {
    const nodes = [mobileScrollRef.current, desktopScrollRef.current].filter(
      (n): n is HTMLDivElement => Boolean(n)
    )
    if (!nodes.length) return

    const onScroll = (event: Event) => {
      const el = event.currentTarget as HTMLDivElement
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
      if (remaining < 320) loadMore()
    }

    for (const node of nodes) {
      node.addEventListener("scroll", onScroll, { passive: true })
    }
    return () => {
      for (const node of nodes) {
        node.removeEventListener("scroll", onScroll)
      }
    }
  }, [loadMore])

  const activeFilterCount = countActiveSamushaoFilters(filters)
  const salaryActive =
    filters.salaryMin > SALARY_MIN || filters.salaryMax < SALARY_MAX ? 1 : 0

  const selectedCategoryIds = useMemo(() => {
    if (filters.categories.length === 0) return [] as number[]
    const list = categories ?? []
    const byName = new Map(list.map((c) => [c.name, c.category_id]))
    return filters.categories
      .map((name) => byName.get(name))
      .filter((id): id is number => id != null && Number.isFinite(id))
  }, [categories, filters.categories])

  // When we send a single city / employment_type to the API, trust that response.
  const serverScopedCity = filters.cities.length === 1
  const serverScopedSchedule = filters.schedules.length === 1

  const filteredJobs = useMemo(() => {
    // Single category is fetched with category_id — trust the API payload.
    // Only apply source + text search on top (both also sent to the API when set).
    const serverScoped = filters.categories.length === 1
    const predicate = (job: Job) => {
      if (selectedSource && job.source !== selectedSource) return false
      if (!serverScoped) {
        if (
          !matchesSamushaoFilters(job, filters, {
            skipCities: serverScopedCity,
            skipSchedules: serverScopedSchedule,
            categoryIds: selectedCategoryIds,
          })
        ) {
          return false
        }
      } else {
        // Still honor experience / work mode / salary / city client filters if set.
        if (
          !matchesSamushaoFilters(job, filters, {
            skipCategories: true,
            skipCities: serverScopedCity,
            skipSchedules: serverScopedSchedule,
            categoryIds: selectedCategoryIds,
          })
        ) {
          return false
        }
      }
      if (debouncedQuery) {
        const q = debouncedQuery.toLowerCase()
        const company = String(job.company || "").toLowerCase()
        const title = String(job.title || "").toLowerCase()
        const location = String(job.location || "").toLowerCase()
        if (!company.includes(q) && !title.includes(q) && !location.includes(q)) {
          return false
        }
      }
      return true
    }
    return jobs.filter((job) => {
      try {
        return predicate(job)
      } catch (err) {
        // A single malformed job must never throw during render and blank the
        // whole board — drop it and keep going.
        console.error("[audience] filter predicate failed for job", job?.id, err)
        return false
      }
    })
  }, [
    jobs,
    selectedSource,
    debouncedQuery,
    filters,
    serverScopedCity,
    serverScopedSchedule,
    selectedCategoryIds,
  ])

  // Retina (DPR 2) Chromium keeps the scroll pane on a GPU layer that it fails to
  // invalidate when React swaps the rows, leaving a stale/blank frame until a
  // resize or scroll forces a recomposite. Nudge a throwaway transform across two
  // frames whenever the visible list changes to force the layer to repaint.
  useEffect(() => {
    const nodes = [mobileScrollRef.current, desktopScrollRef.current].filter(
      (n): n is HTMLDivElement => Boolean(n)
    )
    if (!nodes.length) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      for (const el of nodes) el.style.transform = "translateZ(0)"
      raf2 = requestAnimationFrame(() => {
        for (const el of nodes) el.style.transform = ""
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [filteredJobs])

  function toggleSection(key: keyof OpenSections) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const showEmpty =
    filteredJobs.length === 0 && !loadingReset && !loadingMore
  const showLoadingList =
    filteredJobs.length === 0 && (loadingReset || loadingMore)

  const emptyState = (
    <div className="flex h-full min-h-[240px] w-full flex-1 items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">ვაკანსიები არ მოიძებნა</p>
    </div>
  )

  const loadingListState = (
    <div className="flex h-full min-h-[240px] w-full flex-1 items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">იტვირთება…</p>
    </div>
  )

  const listPlaceholder = showEmpty
    ? emptyState
    : showLoadingList
      ? loadingListState
      : null

  const loadMoreFooter =
    showEmpty ? null : (
      <div className="flex flex-col items-center gap-2 py-6">
        {loadingMore || loadingReset ? (
          <p className="text-sm text-muted-foreground">იტვირთება…</p>
        ) : null}
        {!hasMore && jobs.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            ყველა ვაკანსია ჩაიტვირთა ({formatInt(total)})
          </p>
        ) : null}
        {hasMore && !loadingMore && !loadingReset ? (
          <button
            type="button"
            onClick={loadMore}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            მეტის ჩატვირთვა
          </button>
        ) : null}
      </div>
    )


  return (
    <div className={cn("relative h-full min-h-0 w-full", dark && "dark")}>

      <AudienceFilterSlidePanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        setFilters={setFilters}
        openSections={openSections}
        toggleSection={toggleSection}
        salaryActive={salaryActive}
        activeFilterCount={activeFilterCount}
        categories={categories}
        cities={cities}
      />

      <div className="flex h-full min-h-0 w-full flex-col bg-background">
        {/* Header always fixed */}
        <header className="relative z-20 flex shrink-0 items-center justify-between gap-4 bg-background px-5 py-3.5 sm:px-6 lg:px-10">
          <a
            href="/"
            className="relative z-10 inline-flex shrink-0 items-center transition-opacity hover:opacity-70"
          >
            <span className="font-sans text-lg font-semibold text-black dark:text-white">
              Recruiter.ge
            </span>
          </a>

          <div className="pointer-events-none absolute inset-x-0 hidden justify-center px-5 sm:px-6 lg:flex lg:px-10">
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

        {/* Mobile search + filters — fixed below header */}
        <div className="z-20 flex shrink-0 items-center gap-2 bg-background px-5 pb-3 sm:px-6 lg:hidden">
          <div className="relative min-w-0 flex-1">
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
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-expanded={filterOpen}
            className="relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 text-foreground transition-colors hover:border-border active:bg-secondary"
          >
            <span className="relative">
              <SlidersHorizontal className="size-4" strokeWidth={1.75} />
              {activeFilterCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </span>
            <span className="text-sm font-medium">ფილტრი</span>
          </button>
        </div>

        <div
          ref={mobileScrollRef}
          className="min-h-0 flex-1 overflow-y-auto no-scrollbar lg:flex lg:flex-col lg:overflow-hidden"
        >
          <div className="flex min-w-0 flex-1 gap-4 px-5 sm:gap-6 sm:px-6 lg:min-h-0 lg:overflow-hidden lg:px-10 lg:pb-6">
            {/* Filters — desktop sidebar */}
            <aside className={cn("hidden w-[280px] shrink-0 flex-col overflow-hidden lg:flex", panelClass)}>
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
                <AudienceFiltersBody
                  filters={filters}
                  setFilters={setFilters}
                  openSections={openSections}
                  toggleSection={toggleSection}
                  salaryActive={salaryActive}
                  categories={categories}
                  cities={cities}
                />
              </div>
            </aside>

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col lg:min-h-0 lg:gap-6 lg:overflow-hidden">
              <section className={cn("mb-3 shrink-0 lg:mb-0", selectorCardClass)}>
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
                          ? "text-background/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatInt(platformTotal)}
                    </span>
                  </button>
                  {JOB_SOURCES.map((source) => {
                    const active = selectedSource === source.id
                    const count = sourceCounts.get(source.id) ?? 0
                    if (sources.length > 0 && !JOB_SOURCE_TO_API[source.id]) {
                      return null
                    }
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
                        <span
                          className={cn(
                            "tabular-nums text-[11px]",
                            active ? "text-background/70" : "text-muted-foreground"
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="flex min-h-[280px] min-w-0 flex-1 flex-col pb-2 lg:hidden">
                {listPlaceholder ? (
                  listPlaceholder
                ) : (
                  <ListErrorBoundary label="mobile-jobs">
                    <ul className="space-y-3">
                      {filteredJobs.map((job) => (
                        <li key={job.id}>
                          <JobCardCompact
                            job={job}
                            dense
                            nowMs={nowMs || undefined}
                            onClick={() =>
                              router.push(`/jobs/${encodeURIComponent(job.id)}`)
                            }
                          />
                        </li>
                      ))}
                    </ul>
                    {loadMoreFooter}
                  </ListErrorBoundary>
                )}
              </section>

              {/* Jobs — table on desktop */}
              <section
                className={cn(
                  "hidden min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex",
                  panelClass
                )}
              >
                <div className="flex h-full min-h-[320px] min-w-0 flex-1 flex-col p-4">
                  <div
                    className={cn(
                      "mb-3 grid shrink-0 gap-3 rounded-xl px-5 py-3 text-[12.5px] text-muted-foreground",
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

                  <div
                    ref={desktopScrollRef}
                    className="min-h-0 min-w-0 flex-1 overflow-auto"
                  >
                    {listPlaceholder ? (
                      listPlaceholder
                    ) : (
                      <ListErrorBoundary label="desktop-jobs">
                        <ul className="space-y-3">
                          {filteredJobs.map((job) => {
                            const dates = jobDates(job, nowMs || undefined)
                            return (
                              <li
                                key={job.id}
                                className={cn(
                                  "grid items-center gap-3 rounded-xl border border-border/60 bg-card px-5 py-3.5 shadow-[0_1px_3px_rgba(20,24,40,0.04)]",
                                  tableGrid
                                )}
                              >
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={
                                        typeof job.logo === "string" && job.logo.trim()
                                          ? job.logo.trim()
                                          : "/placeholder.svg"
                                      }
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
                                  <Link
                                    href={`/jobs/${encodeURIComponent(job.id)}`}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                                  >
                                    ნახვა
                                    <ArrowRight className="size-3" strokeWidth={2.25} />
                                  </Link>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                        {loadMoreFooter}
                      </ListErrorBoundary>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
