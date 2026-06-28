"use client"

import { Check, Loader2, X } from "lucide-react"
import type { LiveInterviewDonePayload, LiveInterviewStatus } from "@/lib/live-interview"

const STATUS_LABELS: Record<LiveInterviewStatus, string> = {
  pending: "მოლოდინში",
  in_progress: "ინტერვიუ მიმდინარეობს",
  completed: "დასრულებული",
}

const REQUIREMENT_LABELS = {
  required: "სავალდებულო",
  preferable: "სასურველი",
} as const

function formatCompletedAt(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("ka-GE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getTranscriptText(item: { role?: string; content?: string; text?: string }) {
  return item.content ?? item.text ?? ""
}

interface InterviewResultsPanelProps {
  status: LiveInterviewStatus | null
  result: LiveInterviewDonePayload | null
  error: string | null
  onDismiss?: () => void
}

export function InterviewResultsPanel({ status, result, error, onDismiss }: InterviewResultsPanelProps) {
  if (!status && !result && !error) return null

  const passedCount = result?.responses.filter((item) => item.passed).length ?? 0
  const totalCount = result?.responses.length ?? 0
  const completedAt = formatCompletedAt(result?.completed_at)
  const isWatching = status !== null && status !== "completed" && !result

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground sm:text-xl">Live ინტერვიუ</h3>
          {result ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {passedCount}/{totalCount} კითხვაზე გაიარა
              {completedAt ? ` · ${completedAt}` : ""}
            </p>
          ) : status ? (
            <p className="mt-1 text-sm text-muted-foreground">{STATUS_LABELS[status]}</p>
          ) : null}
        </div>
        {onDismiss && result && (
          <button
            type="button"
            aria-label="შედეგების დამალვა"
            onClick={onDismiss}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isWatching && (
        <div className="flex items-center gap-4 rounded-3xl border border-border/60 bg-secondary/30 px-5 py-4">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary [animation-duration:0.4s]" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">კანდიდატი ინტერვიუზეა</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {status ? STATUS_LABELS[status] : "მოლოდინში"}
            </p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.invitation_text && (
            <div className="rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3 sm:px-5 sm:py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">მოწვევის ტექსტი</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{result.invitation_text}</p>
            </div>
          )}

          <div className="grid gap-3">
            {result.responses.map((item, index) => (
              <div
                key={`${item.question}-${index}`}
                className={`overflow-hidden rounded-2xl border bg-card ${
                  item.passed ? "border-primary/25" : "border-destructive/25"
                }`}
              >
                <div
                  className={`flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5 ${
                    item.passed ? "border-primary/10 bg-primary/5" : "border-destructive/10 bg-destructive/5"
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">კითხვა {index + 1}</p>
                    <p className="text-sm font-semibold leading-6 text-foreground">{item.question}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.passed
                          ? "bg-primary text-primary-foreground"
                          : "bg-destructive text-white"
                      }`}
                    >
                      {item.passed && <Check className="h-3 w-3" aria-hidden="true" />}
                      {item.passed ? "გაიარა" : "ვერ გაიარა"}
                    </span>
                    {item.requirement && (
                      <span className="text-xs text-muted-foreground">
                        {REQUIREMENT_LABELS[item.requirement]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
                  <div className="rounded-xl bg-secondary/40 px-3 py-3">
                    <p className="text-xs font-medium text-muted-foreground">სასურველი პასუხი</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{item.preferred_answer}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/40 px-3 py-3">
                    <p className="text-xs font-medium text-muted-foreground">კანდიდატის პასუხი</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{item.candidate_answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {result.transcript && result.transcript.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-secondary/20 px-4 py-4 sm:px-5">
              <p className="text-sm font-semibold text-foreground">ტრანსკრიპტი</p>
              <div className="mt-3 space-y-3">
                {result.transcript.map((item, index) => {
                  const text = getTranscriptText(item)
                  if (!text) return null
                  return (
                    <div key={`${item.role ?? "line"}-${index}`} className="text-sm leading-6">
                      {item.role && (
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {item.role}
                        </p>
                      )}
                      <p className="text-foreground/90">{text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
