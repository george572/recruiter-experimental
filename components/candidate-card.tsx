import { Check } from "lucide-react"
import type { Candidate } from "@/lib/candidates"

interface CandidateCardProps {
  candidate: Candidate
  animationDelayMs: number
  selected?: boolean
  selectionMode?: boolean
  checked?: boolean
  onSelect?: () => void
}

export function CandidateCard({
  candidate,
  animationDelayMs,
  selected = false,
  selectionMode = false,
  checked = false,
  onSelect,
}: CandidateCardProps) {
  const isHighlighted = selectionMode ? checked : selected

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect?.()
        }
      }}
      aria-pressed={isHighlighted}
      className={`candidate-card-enter relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 shadow-[0_2px_12px_-6px_rgba(20,24,40,0.08)] transition-colors duration-300 sm:p-5 ${
        isHighlighted
          ? selectionMode
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-primary bg-primary text-primary-foreground"
          : selected && selectionMode
            ? "border-primary/40 bg-card ring-1 ring-primary/20"
            : "border-border/60 bg-card hover:border-border"
      }`}
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      {selectionMode && (
        <div
          className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card"
          }`}
          aria-hidden="true"
        >
          {checked && <Check className="h-3 w-3" />}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 pr-6">
        <h3
          className={`text-sm font-semibold sm:text-base ${
            !selectionMode && selected ? "text-primary-foreground" : "text-foreground"
          }`}
        >
          {candidate.firstName} {candidate.lastNameInitial}.
        </h3>
        <span
          className={`shrink-0 text-[11px] sm:text-xs ${
            !selectionMode && selected ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {candidate.lastVisit}
        </span>
      </div>

      <p
        className={`text-xs font-medium tabular-nums sm:text-sm ${
          !selectionMode && selected ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {candidate.preferredSalary}
        <span
          className={
            !selectionMode && selected ? "text-primary-foreground/70" : "font-normal text-muted-foreground"
          }
        >
          {" "}
          /თვე
        </span>
      </p>

      <p
        className={`text-xs leading-5 sm:text-sm sm:leading-6 ${
          !selectionMode && selected ? "text-primary-foreground/80" : "text-muted-foreground"
        }`}
      >
        {candidate.fitDescription}
      </p>
    </article>
  )
}
