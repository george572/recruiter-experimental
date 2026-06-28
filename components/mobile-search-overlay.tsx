"use client"

import { useEffect, useRef } from "react"
import { Search, X } from "lucide-react"

interface MobileSearchOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  onQueryChange: (query: string) => void
  resultCount?: number
}

export function MobileSearchOverlay({
  open,
  onOpenChange,
  query,
  onQueryChange,
  resultCount,
}: MobileSearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!open) return
    const timeout = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 80)
    return () => window.clearTimeout(timeout)
  }, [open])

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center px-4 transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="ძიების დახურვა"
        tabIndex={open ? 0 : -1}
        className="absolute inset-0 cursor-default bg-white/75 backdrop-blur-xl"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-border/60 bg-white p-8 shadow-[0_12px_40px_-16px_rgba(20,24,40,0.18)]">
          <div className="flex items-center gap-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="მოძებნე პოზიცია, კომპანია…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              aria-label="ძიების დახურვა"
              onClick={() => onOpenChange(false)}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {query.trim() && resultCount !== undefined && (
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{resultCount}</span> ვაკანსია მოიძებნა
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
