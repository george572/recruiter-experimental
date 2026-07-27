"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  SearchResponse,
  SmartFiltersPayload,
  JobResult,
} from "@/lib/search/types";
import { SearchBox } from "@/components/search/search-box";
import { LoadingSpinner } from "@/components/search/loading-spinner";
import { JobResultItem } from "@/components/search/job-result-item";
import { Pagination } from "@/components/search/pagination";

type View = "home" | "loading" | "results";

const PAGE_SIZE = 10;

type PageCacheEntry = {
  results: JobResult[];
  total: number;
  hasMore: boolean;
};

function filtersToParams(filters: SmartFiltersPayload): URLSearchParams {
  const params = new URLSearchParams();
  params.set("q", filters.q);
  params.set("smart", "0");
  if (filters.qAlternates?.length) {
    params.set("q_alt", filters.qAlternates.join("|"));
  }
  if (filters.qBranches?.length) {
    params.set("q_branches", filters.qBranches.join("|"));
  }
  if (filters.categoryId != null) {
    params.set("category_id", String(filters.categoryId));
  }
  if (filters.categoryName) {
    params.set("category_name", filters.categoryName);
  }
  if (filters.relatedCategoryId != null) {
    params.set("related_category_id", String(filters.relatedCategoryId));
  }
  if (filters.relatedCategoryName) {
    params.set("related_category_name", filters.relatedCategoryName);
  }
  if (filters.city) params.set("city", filters.city);
  if (filters.salaryMin != null) {
    params.set("salary_min", String(filters.salaryMin));
  }
  if (filters.salaryMax != null) {
    params.set("salary_max", String(filters.salaryMax));
  }
  if (filters.hasSalary) params.set("has_salary", "1");
  if (filters.workingMode) params.set("working_mode", filters.workingMode);
  if (filters.experience?.length) {
    params.set("experience", filters.experience.join(","));
  }
  if (filters.employmentType) {
    params.set("employment_type", filters.employmentType);
  }
  if (filters.preferRoleFamilies?.length) {
    params.set("prefer_roles", filters.preferRoleFamilies.join(","));
  }
  if (filters.preferSkills?.length) {
    params.set("prefer_skills", filters.preferSkills.join(","));
  }
  if (filters.preferPayCadence?.length) {
    params.set("prefer_pay", filters.preferPayCadence.join(","));
  }
  if (filters.intentId) params.set("intent_id", filters.intentId);
  if (filters.uploadedSince === "today") {
    params.set("uploaded_since", "today");
  }
  if (filters.order) params.set("order", filters.order);
  return params;
}

function filterChips(filters: SmartFiltersPayload): string[] {
  const chips: string[] = [];
  if (filters.qBranches && filters.qBranches.length >= 2) {
    chips.push(...filters.qBranches);
  }
  if (filters.uploadedSince === "today") chips.push("დღევანდელი");
  if (filters.city) chips.push(filters.city);
  if (filters.workingMode === "remote") chips.push("დისტანციური");
  if (filters.workingMode === "onsite") chips.push("ოფისიდან");
  if (filters.salaryMin != null && filters.salaryMax != null) {
    chips.push(
      `${filters.salaryMin.toLocaleString("en-US")}–${filters.salaryMax.toLocaleString("en-US")} ₾`,
    );
  } else if (filters.salaryMin != null) {
    chips.push(`${filters.salaryMin.toLocaleString("en-US")}+ ₾`);
  } else if (filters.salaryMax != null) {
    chips.push(`≤ ${filters.salaryMax.toLocaleString("en-US")} ₾`);
  } else if (filters.hasSalary) {
    chips.push("ხელფასიანი");
  }
  if (filters.experience?.length) chips.push(...filters.experience);
  if (filters.employmentType) chips.push(filters.employmentType);
  return chips;
}

function searchHref(q: string, page = 1): string {
  const params = new URLSearchParams();
  params.set("q", q);
  if (page > 1) params.set("page", String(page));
  return `/?${params.toString()}`;
}

/** Prefer the API's exact total; only infer an end from a short final page. */
function resolveTotal(
  reportedTotal: number,
  resultCount: number,
  pageNum: number,
  hasMore: boolean,
): number {
  const offset = (Math.max(1, pageNum) - 1) * PAGE_SIZE;
  if (resultCount === 0 && pageNum > 1) {
    return Math.max(reportedTotal, offset);
  }
  if (!hasMore) {
    return offset + resultCount;
  }
  return Math.max(reportedTotal, offset + resultCount);
}

export function JobSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = (searchParams.get("q") || "").trim();
  const urlPageRaw = Number(searchParams.get("page") || "1");
  const urlPage =
    Number.isFinite(urlPageRaw) && urlPageRaw >= 1
      ? Math.floor(urlPageRaw)
      : 1;

  const [query, setQuery] = useState(urlQuery);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<SmartFiltersPayload | null>(null);
  const [view, setView] = useState<View>(urlQuery ? "loading" : "home");
  const [results, setResults] = useState<JobResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState<number | null>(null);

  const activeQueryRef = useRef("");
  const pageRef = useRef(1);
  const pageCacheRef = useRef<Map<number, PageCacheEntry>>(new Map());
  const prefetchRef = useRef<Set<number>>(new Set());
  const filtersRef = useRef<SmartFiltersPayload | null>(null);
  const loadGenRef = useRef(0);
  /** Logo → home: ignore stale /?q=… until the URL actually clears. */
  const forceHomeRef = useRef(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as {
          totalJobs?: number | null;
        } | null;
        if (cancelled) return;
        if (typeof data?.totalJobs === "number" && data.totalJobs > 0) {
          setTotalJobs(data.totalJobs);
        }
      } catch {
        // Keep null; home still works without the count.
      }
    }

    void loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  async function fetchSmartPage(q: string): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q,
      limit: String(PAGE_SIZE),
      offset: "0",
    });
    const res = await fetch(`/api/search?${params}`);
    if (!res.ok) throw new Error("Search failed");
    return (await res.json()) as SearchResponse;
  }

  async function fetchFilteredPage(
    nextFilters: SmartFiltersPayload,
    offset: number,
  ): Promise<SearchResponse> {
    const params = filtersToParams(nextFilters);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));
    const res = await fetch(`/api/search?${params}`);
    if (!res.ok) throw new Error("Search failed");
    return (await res.json()) as SearchResponse;
  }

  function jumpTop() {
    window.scrollTo(0, 0);
  }

  function cachePage(pageNum: number, data: PageCacheEntry) {
    pageCacheRef.current.set(pageNum, data);
  }

  function prefetchPage(
    pageNum: number,
    pageFilters: SmartFiltersPayload,
    queryKey: string,
  ) {
    if (pageNum < 1) return;
    if (pageCacheRef.current.has(pageNum)) return;
    if (prefetchRef.current.has(pageNum)) return;
    prefetchRef.current.add(pageNum);

    const offset = (pageNum - 1) * PAGE_SIZE;
    void fetchFilteredPage(pageFilters, offset)
      .then((data) => {
        if (activeQueryRef.current !== queryKey) return;
        const total = resolveTotal(
          data.total,
          data.results.length,
          pageNum,
          Boolean(data.hasMore),
        );
        cachePage(pageNum, {
          results: data.results,
          total,
          hasMore: Boolean(data.hasMore),
        });
        // Keep a single shared total across cached pages.
        for (const [key, entry] of pageCacheRef.current) {
          if (entry.total !== total) {
            pageCacheRef.current.set(key, { ...entry, total });
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        prefetchRef.current.delete(pageNum);
      });
  }

  function clearSearchState() {
    activeQueryRef.current = "";
    pageCacheRef.current = new Map();
    prefetchRef.current = new Set();
    setView("home");
    setQuery("");
    setResults([]);
    setSubmittedQuery("");
    setFilters(null);
    setTotal(0);
    setPage(1);
    pageRef.current = 1;
  }

  async function ensureQueryLoaded(q: string): Promise<SmartFiltersPayload | null> {
    if (activeQueryRef.current === q && filtersRef.current) {
      setQuery(q);
      setSubmittedQuery(q);
      return filtersRef.current;
    }

    activeQueryRef.current = q;
    pageCacheRef.current = new Map();
    prefetchRef.current = new Set();
    setSubmittedQuery(q);
    setQuery(q);
    setFilters(null);
    setView("loading");
    setResults([]);
    setTotal(0);
    setPage(1);
    pageRef.current = 1;

    try {
      const data = await fetchSmartPage(q);
      if (activeQueryRef.current !== q) return null;
      const total = resolveTotal(
        data.total,
        data.results.length,
        1,
        Boolean(data.hasMore),
      );
      cachePage(1, {
        results: data.results,
        total,
        hasMore: Boolean(data.hasMore),
      });
      setTotal(total);
      setFilters(data.filters);
      filtersRef.current = data.filters;
      if (data.filters && total > PAGE_SIZE) {
        prefetchPage(2, data.filters, q);
      }
      return data.filters;
    } catch {
      if (activeQueryRef.current !== q) return null;
      setResults([]);
      setTotal(0);
      setFilters(null);
      filtersRef.current = null;
      setView("results");
      return null;
    }
  }

  async function showPage(
    q: string,
    pageFilters: SmartFiltersPayload,
    nextPage: number,
  ) {
    const safePage = Math.max(1, nextPage);
    pageRef.current = safePage;
    setPage(safePage);
    setSubmittedQuery(q);
    setQuery(q);

    const applyPage = (
      pageNum: number,
      results: JobResult[],
      total: number,
      hasMore: boolean,
    ) => {
      cachePage(pageNum, { results, total, hasMore });
      for (const [key, entry] of pageCacheRef.current) {
        if (entry.total !== total) {
          pageCacheRef.current.set(key, { ...entry, total });
        }
      }
      if (pageRef.current !== pageNum) return;
      setResults(results);
      setTotal(total);
      setPage(pageNum);
      pageRef.current = pageNum;
      setView("results");
      prefetchPage(pageNum - 1, pageFilters, q);
      prefetchPage(pageNum + 1, pageFilters, q);
    };

    const cached = pageCacheRef.current.get(safePage);
    if (cached) {
      const total = resolveTotal(
        cached.total,
        cached.results.length,
        safePage,
        cached.hasMore,
      );
      applyPage(safePage, cached.results, total, cached.hasMore);
      return;
    }

    setView("loading");
    try {
      const data = await fetchFilteredPage(
        pageFilters,
        (safePage - 1) * PAGE_SIZE,
      );
      if (activeQueryRef.current !== q) return;

      // Past the end — snap to the last page that actually has results.
      if (data.results.length === 0 && safePage > 1) {
        const known = Math.max(data.total, 0);
        const lastPage = Math.max(1, Math.ceil(known / PAGE_SIZE) || 1);
        if (lastPage < safePage) {
          await showPage(q, pageFilters, lastPage);
          if (urlPage !== lastPage) {
            router.replace(searchHref(q, lastPage));
          }
          return;
        }
      }

      const total = resolveTotal(
        data.total,
        data.results.length,
        safePage,
        Boolean(data.hasMore),
      );
      applyPage(safePage, data.results, total, Boolean(data.hasMore));
    } catch {
      if (activeQueryRef.current !== q) return;
      setView("results");
    }
  }

  // URL is the source of truth (refresh, back/forward, shared links).
  useEffect(() => {
    const gen = ++loadGenRef.current;
    jumpTop();

    if (!urlQuery) {
      forceHomeRef.current = false;
      clearSearchState();
      return;
    }

    // Logo click cleared UI but App Router may keep stale ?q= on "/".
    if (forceHomeRef.current) {
      clearSearchState();
      return;
    }

    void (async () => {
      const pageFilters = await ensureQueryLoaded(urlQuery);
      if (loadGenRef.current !== gen) return;
      if (!pageFilters) return;

      // Trust the URL page. Clamping to page-1's early total blocked later pages
      // after totals were refined (URL changed, UI stayed put).
      await showPage(urlQuery, pageFilters, Math.max(1, urlPage));
    })();
    // URL is the only driver; helpers read latest refs intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, urlPage]);

  function runSearch(rawQuery: string) {
    const q = rawQuery.trim();
    if (!q) return;
    forceHomeRef.current = false;
    setQuery(q);

    // Same URL won't remount the effect — force a fresh load.
    if (urlQuery === q && urlPage === 1) {
      activeQueryRef.current = "";
      filtersRef.current = null;
      const gen = ++loadGenRef.current;
      jumpTop();
      void (async () => {
        const pageFilters = await ensureQueryLoaded(q);
        if (loadGenRef.current !== gen) return;
        if (!pageFilters) return;
        await showPage(q, pageFilters, 1);
      })();
      return;
    }

    router.push(searchHref(q, 1));
  }

  function goToPage(nextPage: number) {
    const q = urlQuery || activeQueryRef.current;
    if (!q) return;
    if (nextPage < 1 || nextPage > totalPages || nextPage === pageRef.current) {
      return;
    }
    router.push(searchHref(q, nextPage));
  }

  function resetToHome() {
    // Instant UI reset — don't wait for the router (same-pathname /?q→/ is flaky).
    forceHomeRef.current = true;
    loadGenRef.current += 1;
    clearSearchState();
    filtersRef.current = null;
    jumpTop();
    router.replace("/");
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(window.history.state, "", "/");
    }
  }

  const chips = filters ? filterChips(filters) : [];

  if (view === "home") {
    return (
      <main className="h-full flex-1 overflow-y-auto px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col items-center justify-center py-10">
          <div className="mb-6 w-full px-1 text-center animate-rise sm:mb-10">
            <h1 className="font-brand text-[2.75rem] leading-none font-normal text-foreground sm:text-6xl">
              Recruiter.ge
            </h1>
            <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed sm:mt-4 sm:text-lg">
              იპოვე საქართველოში არსებული ყველა ვაკანსია
            </p>
            {totalJobs != null ? (
              <p className="mt-3 text-sm font-bold tabular-nums text-foreground">
                {totalJobs.toLocaleString("en-US")} ვაკანსია
              </p>
            ) : null}
          </div>
          <div className="flex w-full justify-center animate-rise [animation-delay:60ms]">
            <SearchBox
              value={query}
              onChange={setQuery}
              onSubmit={(q) => runSearch(q ?? query)}
              variant="hero"
              autoFocus
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full flex-1 overflow-y-auto">
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex flex-col gap-2.5 px-3 py-2.5 sm:grid sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8 sm:px-6 sm:py-3.5">
          <button
            type="button"
            onClick={resetToHome}
            className="flex min-h-10 shrink-0 items-center self-start font-brand text-xl font-normal text-foreground transition-opacity active:opacity-70 sm:hover:opacity-70"
            aria-label="Recruiter.ge — მთავარი"
          >
            Recruiter.ge
          </button>
          <div className="w-full min-w-0">
            <SearchBox
              value={query}
              onChange={setQuery}
              onSubmit={(q) => runSearch(q ?? query)}
              variant="compact"
            />
          </div>
        </div>
      </header>

      <div className="px-3 pt-4 pb-[max(4rem,env(safe-area-inset-bottom))] sm:grid sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8 sm:px-6 sm:pt-6 sm:pb-16">
        <div
          aria-hidden
          className="invisible pointer-events-none select-none shrink-0 font-brand text-xl font-normal hidden sm:block"
        >
          Recruiter.ge
        </div>

        <div className="min-w-0 w-full sm:w-[80%]">
          {view === "loading" ? (
            <LoadingSpinner />
          ) : (
            <div className="w-full">
              <p className="mb-3 text-[13px] text-muted-foreground sm:mb-4 sm:text-sm">
                <span className="font-medium text-foreground">
                  {total.toLocaleString("en-US")}
                </span>{" "}
                შედეგი — „
                <span className="break-words">{submittedQuery}</span>“
              </p>
              {chips.length > 0 ? (
                <p className="mb-3 text-[13px] text-muted-foreground sm:mb-4 sm:text-sm">
                  {chips.join(" · ")}
                </p>
              ) : null}

              {results.length === 0 ? (
                <div className="py-4">
                  <p className="mb-2 text-lg font-semibold text-foreground sm:text-xl">
                    შედეგები ვერ მოიძებნა
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    სცადე უფრო თავისუფალი აღწერა, მაგალითად: თბილისში remote
                    frontend 2500 ლარიდან
                  </p>
                </div>
              ) : (
                <>
                  <ul className="flex flex-col divide-y divide-border">
                    {results.map((job) => (
                      <li key={`${page}-${job.id}`}>
                        <JobResultItem job={job} />
                      </li>
                    ))}
                  </ul>

                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
