"use client"

import { useEffect, useState } from "react"
import { Sparkles, X } from "lucide-react"
import { AutomationFormPanel } from "@/components/automation-form-panel"

interface AutomationSlidePanelProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AutomationSlidePanel({ open: openProp, onOpenChange }: AutomationSlidePanelProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen

  function setOpen(value: boolean) {
    if (!isControlled) setInternalOpen(value)
    onOpenChange?.(value)
  }

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

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
        aria-label="Recruiter AI-ის დახურვა"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        className={`fixed inset-0 z-[55] cursor-default bg-foreground/25 backdrop-blur-md transition-opacity duration-500 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        aria-hidden={!open}
        className={`fixed inset-x-[10px] bottom-0 z-[60] flex h-[95%] flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-8px_40px_-12px_rgba(20,24,40,0.18),0_24px_64px_-24px_rgba(20,24,40,0.35)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:inset-x-auto lg:left-1/2 lg:w-full lg:max-w-xl lg:-translate-x-1/2 ${
          open ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-white p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Recruiter AI</h2>
          </div>
          <button
            type="button"
            aria-label="Recruiter AI-ის დახურვა"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-8 no-scrollbar">
          <AutomationFormPanel />
        </div>
      </aside>
    </>
  )
}
