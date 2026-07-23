"use client"

import { useEffect, useState, type FormEvent } from "react"
import { usePathname } from "next/navigation"
import { CircleHelp, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

const OPEN_EVENT = "recruiter:feedback-open"
const MAX_LENGTH = 2000

type PromptState = "hidden" | "open" | "sending" | "thanks"

export function openFeedback() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}

export function FeedbackTrigger({
  className,
  "aria-label": ariaLabel = "კავშირი ჩვენთან",
}: {
  className?: string
  "aria-label"?: string
}) {
  return (
    <button
      type="button"
      onClick={openFeedback}
      aria-label={ariaLabel}
      className={cn(
        "relative z-10 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-colors hover:border-border hover:text-foreground",
        className
      )}
    >
      <CircleHelp className="size-4" strokeWidth={1.75} />
    </button>
  )
}

export function FeedbackPrompt() {
  const pathname = usePathname()
  const [state, setState] = useState<PromptState>("hidden")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    function onOpen() {
      setError(null)
      setState("open")
    }

    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (state !== "open" && state !== "sending" && state !== "thanks") {
      setEntered(false)
      return
    }
    const frame = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(frame)
  }, [state])

  useEffect(() => {
    if (state !== "open" && state !== "sending") return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [state])

  function dismiss() {
    setEntered(false)
    window.setTimeout(() => {
      setState("hidden")
      setMessage("")
      setError(null)
    }, 200)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const text = message.trim()
    if (!text) {
      setError("გთხოვთ, დაწერეთ თქვენი აზრი")
      return
    }

    setError(null)
    setState("sending")

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.slice(0, MAX_LENGTH),
          path: pathname,
        }),
      })
      if (!res.ok) throw new Error("failed")
      setState("thanks")
      window.setTimeout(() => {
        setEntered(false)
        window.setTimeout(() => {
          setState("hidden")
          setMessage("")
          setError(null)
        }, 200)
      }, 1800)
    } catch {
      setState("open")
      setError("გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან.")
    }
  }

  if (state === "hidden") return null

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[70] flex justify-center p-4",
        // Mobile: centered
        "inset-0 items-center",
        // Desktop: bottom-right card
        "md:inset-auto md:bottom-5 md:right-5 md:items-end md:justify-end md:p-0"
      )}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-prompt-title"
        className={cn(
          "pointer-events-auto w-full max-w-[22rem] rounded-3xl border border-border/60 bg-card p-5 shadow-[0_16px_48px_-20px_rgba(20,24,40,0.28)] transition-all duration-300 ease-out",
          entered
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.98] opacity-0 md:translate-y-4"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              id="feedback-prompt-title"
              className="text-[13.5px] font-semibold leading-5 text-foreground"
            >
              გთხოვთ, გვითხარით რა მოგწონთ და რა არ მოგწონთ პლატფორმაში.
            </p>
            <p className="mt-2 text-[12.5px] leading-5 text-muted-foreground">
              თქვენს აზრს გავითვალისწინებთ და პლატფორმას გავაუმჯობესებთ.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="დახურვა"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        {state === "thanks" ? (
          <p className="mt-4 text-[13px] font-medium text-foreground">
            მადლობა! თქვენი აზრი მიღებულია.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (error) setError(null)
              }}
              rows={4}
              maxLength={MAX_LENGTH}
              disabled={state === "sending"}
              placeholder="დაწერეთ აქ..."
              className="w-full resize-none rounded-2xl border border-border/60 bg-secondary/30 px-3.5 py-3 text-[13px] leading-5 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/20"
            />
            {error ? (
              <p className="text-[12px] text-destructive">{error}</p>
            ) : null}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={dismiss}
                disabled={state === "sending"}
                className="inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={state === "sending" || !message.trim()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {state === "sending" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={2.25} />
                    იგზავნება
                  </>
                ) : (
                  "გაგზავნა"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
