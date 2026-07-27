"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  RECENT_STORAGE_KEY,
  pushLocalRecentSearch,
  readLocalRecentSearches,
  recordSiteSearch,
} from "@/lib/search/recent-searches";
import { getOrCreateVisitorId } from "@/lib/visitor-id";

const COLUMN_COUNT = 8;

const QUICK_SEARCHES = [
  "გაყიდვები 2000 ლარს ზევით",
  "დღიური",
  "დღევანდელი ვაკანსიები",
] as const;

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query?: string) => void;
  variant: "hero" | "compact";
  autoFocus?: boolean;
};

export function SearchBox({
  value,
  onChange,
  onSubmit,
  variant,
  autoFocus,
}: SearchBoxProps) {
  const isHero = variant === "hero";
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<string[]>([]);
  const [others, setOthers] = useState<string[]>([]);

  useEffect(() => {
    if (!autoFocus) return;
    const input = inputRef.current;
    if (!input) return;
    const id = requestAnimationFrame(() => {
      input.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [autoFocus]);

  useEffect(() => {
    setMine(readLocalRecentSearches(COLUMN_COUNT));

    let cancelled = false;
    const visitorUid = getOrCreateVisitorId();

    function withoutMine(queries: string[], mineList: string[]) {
      const blocked = new Set(
        mineList.map((q) => q.trim().toLowerCase()).filter(Boolean),
      );
      const out: string[] = [];
      const seen = new Set<string>();
      for (const q of queries) {
        const trimmed = q.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (blocked.has(key) || seen.has(key)) continue;
        seen.add(key);
        out.push(trimmed);
        if (out.length >= COLUMN_COUNT) break;
      }
      return out;
    }

    async function loadRecent() {
      if (!visitorUid) return;
      try {
        const recentRes = await fetch(
          `/api/recent-searches?visitor_uid=${encodeURIComponent(visitorUid)}&limit=${COLUMN_COUNT}`,
        );
        if (cancelled || !recentRes.ok) return;
        const data = (await recentRes.json().catch(() => null)) as {
          queries?: string[];
        } | null;
        if (!Array.isArray(data?.queries) || data.queries.length === 0) return;
        const merged = mergeRecent(
          data.queries,
          readLocalRecentSearches(COLUMN_COUNT),
        );
        setMine(merged);
        try {
          window.localStorage.setItem(
            RECENT_STORAGE_KEY,
            JSON.stringify(merged),
          );
        } catch {
          // ignore
        }
      } catch {
        // Keep local recent.
      }
    }

    async function loadLiveOthers() {
      try {
        const qs = new URLSearchParams({
          limit: String(COLUMN_COUNT * 2),
        });
        if (visitorUid) qs.set("visitor_uid", visitorUid);
        const liveRes = await fetch(`/api/live-searches?${qs}`, {
          cache: "no-store",
        });
        if (cancelled || !liveRes.ok) return;
        const data = (await liveRes.json().catch(() => null)) as {
          queries?: string[];
        } | null;
        if (!Array.isArray(data?.queries)) return;
        const localMine = readLocalRecentSearches(COLUMN_COUNT * 3);
        setOthers(withoutMine(data.queries, localMine));
      } catch {
        // Leave previous others until the next poll.
      }
    }

    void loadRecent().then(() => loadLiveOthers());
    // Keep “სხვები ამჟამად ეძებენ” fresh while the page is open.
    const liveTimer = window.setInterval(() => {
      void loadLiveOthers();
    }, 12_000);

    return () => {
      cancelled = true;
      window.clearInterval(liveTimer);
    };
  }, []);

  // After I search, drop that query from the “others” column immediately.
  useEffect(() => {
    if (!mine.length) return;
    const blocked = new Set(
      mine.map((q) => q.trim().toLowerCase()).filter(Boolean),
    );
    setOthers((prev) =>
      prev.filter((q) => !blocked.has(q.trim().toLowerCase())),
    );
  }, [mine]);

  function openMenu() {
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
  }

  function currentQuery(explicit?: string) {
    return (explicit ?? inputRef.current?.value ?? value).trim();
  }

  function rememberSearch(q: string) {
    setMine(pushLocalRecentSearch(q, COLUMN_COUNT));
    void recordSiteSearch(q);
  }

  function submitSearch(explicit?: string) {
    const q = currentQuery(explicit);
    if (!q) {
      inputRef.current?.focus();
      return;
    }
    closeMenu();
    onChange(q);
    rememberSearch(q);
    onSubmit(q);
    requestAnimationFrame(() => inputRef.current?.blur());
  }

  function pickSuggestion(query: string) {
    onChange(query);
    closeMenu();
    rememberSearch(query);
    onSubmit(query);
    requestAnimationFrame(() => inputRef.current?.blur());
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const showMine = mine.length > 0;
  const showOthers = others.length > 0;
  const twoCol = showMine && showOthers;

  return (
    <div
      ref={rootRef}
      className={[
        "relative",
        isHero ? "w-full max-w-[640px]" : "w-full sm:max-w-[560px]",
      ].join(" ")}
    >
      <label className="sr-only" htmlFor="job-search">
        ძებნა
      </label>
      <div
        className={[
          "relative z-20 flex items-center gap-1 bg-card shadow-search sm:gap-1.5",
          isHero
            ? "rounded-[22px] pl-4 pr-1.5 py-1.5 sm:rounded-[26px] sm:pl-5 sm:pr-2 sm:py-2"
            : "rounded-2xl pl-3 pr-1 py-1 sm:pl-3.5 sm:pr-1.5 sm:py-1.5",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          id="job-search"
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={value}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onFocus={openMenu}
          onClick={openMenu}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitSearch();
            }
          }}
          placeholder={isHero ? "რა ვაკანსიას ეძებ?" : "ძებნა…"}
          className={[
            "min-w-0 w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70 text-base",
            isHero ? "py-2.5 sm:text-lg" : "py-2 sm:py-1.5",
          ].join(" ")}
        />
        {value ? (
          <button
            type="button"
            aria-label="გასუფთავება"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
              openMenu();
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground active:bg-slate-100 sm:size-9"
          >
            <ClearIcon className="size-4" />
          </button>
        ) : null}
        <button
          type="button"
          aria-label="ძებნა"
          onClick={() => submitSearch()}
          className={[
            "flex shrink-0 items-center justify-center rounded-xl bg-ink text-white active:opacity-80",
            isHero ? "size-11 sm:size-12" : "size-10 sm:size-9",
          ].join(" ")}
        >
          <SearchIcon className={isHero ? "size-5" : "size-4"} />
        </button>
      </div>

      {open && (showMine || showOthers) ? (
        <div
          id={listId}
          role="listbox"
          aria-label="ძებნის შემოთავაზებები"
          className={[
            "absolute left-0 right-0 z-10 mt-2 max-h-[min(70dvh,420px)] overflow-y-auto overscroll-contain border border-border bg-white shadow-soft-lg animate-rise",
            isHero ? "rounded-[20px] sm:rounded-[22px]" : "rounded-2xl",
            twoCol
              ? "sm:min-w-[min(100vw-2rem,720px)] sm:w-[max(100%,640px)]"
              : "",
          ].join(" ")}
        >
          <div
            className={[
              "grid",
              twoCol
                ? "grid-cols-1 sm:grid-cols-2 sm:divide-x sm:divide-border"
                : "grid-cols-1",
            ].join(" ")}
          >
            {showMine ? (
              <SuggestionColumn
                title="შენს მიერ ბოლოს მოძებნილი"
                queries={mine}
                icon="history"
                onPick={pickSuggestion}
              />
            ) : null}
            {showOthers ? (
              <SuggestionColumn
                title="სხვები ამჟამად ეძებენ"
                queries={others}
                icon="trend"
                onPick={pickSuggestion}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {isHero ? (
        <div
          className="mt-4 flex w-full flex-wrap justify-center gap-2 animate-rise [animation-delay:90ms] sm:mt-5 sm:gap-2.5"
          aria-label="სწრაფი ძებნა"
        >
          {QUICK_SEARCHES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => pickSuggestion(label)}
              className="max-w-full rounded-full border border-border bg-white px-3.5 py-2 text-[13px] leading-snug text-foreground shadow-soft-sm transition-[background-color,border-color,transform] active:scale-[0.98] active:bg-slate-50 sm:px-4 sm:py-2 sm:text-sm sm:hover:border-foreground/20 sm:hover:bg-slate-50"
            >
              <span className="block truncate">{label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function mergeRecent(fromDb: string[], fromLocal: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const q of [...fromLocal, ...fromDb]) {
    const trimmed = q.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= COLUMN_COUNT) break;
  }
  return out;
}

function SuggestionColumn({
  title,
  queries,
  icon,
  onPick,
}: {
  title: string;
  queries: string[];
  icon: "history" | "trend";
  onPick: (query: string) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="sticky top-0 bg-white px-4 pt-3.5 pb-2">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      </div>
      <ul className="pb-2">
        {queries.map((suggestion) => (
          <li key={`${title}-${suggestion}`} role="option">
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => onPick(suggestion)}
              className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-foreground active:bg-slate-50 sm:min-h-0 sm:py-2.5 sm:hover:opacity-70"
            >
              {icon === "history" ? (
                <HistoryIcon className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <TrendIcon className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{suggestion}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M14 7h6v6" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
