"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Loader2, X } from "lucide-react"
import {
  getOverviewStats,
  getQuestionStats,
  loadBulkInterviewResults,
  type BulkInterviewResultsSession,
  type CandidateInterviewResult,
} from "@/lib/bulk-interview-results"

const STATUS_LABELS = {
  pending: "მოლოდინში",
  in_progress: "მიმდინარეობს",
  completed: "დასრულებული",
} as const

const REQUIREMENT_LABELS = {
  required: "სავალდებულო",
  preferable: "სასურველი",
} as const

function StatCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "danger" | "muted" }) {
  const toneClass =
    tone === "success"
      ? "text-primary"
      : tone === "danger"
        ? "text-destructive"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground"

  return (
    <div className="rounded-2xl border border-border/60 bg-card px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums sm:text-3xl ${toneClass}`}>{value}</p>
    </div>
  )
}

function ResponseCell({ passed, status }: { passed?: boolean; status: CandidateInterviewResult["status"] }) {
  if (status !== "completed") {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return passed ? (
    <Check className="mx-auto h-4 w-4 text-primary" aria-label="გაიარა" />
  ) : (
    <X className="mx-auto h-4 w-4 text-destructive" aria-label="ვერ გაიარა" />
  )
}

export function CandidateInterviewResults() {
  const router = useRouter()
  const [session, setSession] = useState<BulkInterviewResultsSession | null>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [checkedCandidateIds, setCheckedCandidateIds] = useState<string[]>([])
  const [physicalInviteSent, setPhysicalInviteSent] = useState(false)

  useEffect(() => {
    const data = loadBulkInterviewResults()
    if (!data) {
      router.replace("/dashboard/app")
      return
    }
    setSession(data)
    const firstCompleted = data.candidates.find((candidate) => candidate.status === "completed")
    setSelectedCandidateId(firstCompleted?.candidateId ?? data.candidates[0]?.candidateId ?? null)
  }, [router])

  const overview = useMemo(() => (session ? getOverviewStats(session) : null), [session])
  const questionStats = useMemo(() => (session ? getQuestionStats(session) : null), [session])

  const selectedCandidate =
    session?.candidates.find((candidate) => candidate.candidateId === selectedCandidateId) ?? null

  function toggleCandidateSelection(candidateId: string) {
    setCheckedCandidateIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId],
    )
  }

  function handlePhysicalInvite() {
    if (checkedCandidateIds.length === 0) return
    setPhysicalInviteSent(true)
    window.setTimeout(() => setPhysicalInviteSent(false), 2200)
  }

  if (!session || !overview || !questionStats) {
    return (
      <div className="flex h-screen items-center justify-center overflow-y-auto">
        <Loader2 className="h-8 w-8 animate-spin text-primary [animation-duration:0.4s]" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-y-auto px-[25px] py-10 lg:px-[60px]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 pb-28 pt-12 sm:gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              კანდიდატების ინტერვიუს შედეგები
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {session.candidates.length} კანდიდატზე გაგზავნილი live ინტერვიუ · {session.questions.length} კითხვა
            </p>
          </div>

          <button
            type="button"
            onClick={handlePhysicalInvite}
            disabled={checkedCandidateIds.length === 0}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {physicalInviteSent
              ? "მოწვევა გაგზავნილია"
              : `მოიწვიე ფიზიკურ ინტერვიუზე${checkedCandidateIds.length > 0 ? ` (${checkedCandidateIds.length})` : ""}`}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
          <StatCard label="მოწვეული" value={overview.invited} />
          <StatCard label="პასუხი მიღებული" value={overview.completed} tone="success" />
          <StatCard label="მოლოდინში" value={overview.pending} tone="muted" />
          <StatCard label="მიმდინარეობს" value={overview.inProgress} tone="muted" />
          <StatCard label="სრულად გაიარა" value={overview.passedAll} tone="success" />
          <StatCard label="შეცდომით" value={overview.failedSome} tone="danger" />
        </div>

        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-[0_12px_40px_-16px_rgba(20,24,40,0.14)] sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">კითხვების მიმოხილვა</h2>
          <div className="mt-4 space-y-3">
            {questionStats.map((item, index) => (
              <div key={`${item.question}-${index}`} className="rounded-2xl border border-border/60 bg-secondary/20 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      კითხვა {index + 1} · {REQUIREMENT_LABELS[item.requirement]}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-foreground">{item.question}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      გაიარა {item.passed}
                    </span>
                    <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                      ვერ გაიარა {item.failed}
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                      მოლოდინში {item.pending}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <section className="rounded-3xl border border-border/60 bg-card shadow-[0_12px_40px_-16px_rgba(20,24,40,0.14)]">
            <div className="border-b border-border/60 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-foreground">კანდიდატების მატრიცა</h2>
              <p className="mt-1 text-sm text-muted-foreground">აირჩიე კანდიდატები ფიზიკურ ინტერვიუზე მოსაწვევად</p>
            </div>

            <div className="no-scrollbar max-h-[min(70vh,720px)] overflow-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-sm">
                  <tr className="border-b border-border/60 bg-secondary/20">
                    <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">არჩევა</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">კანდიდატი</th>
                    {session.questions.map((_, index) => (
                      <th key={`q-head-${index}`} className="px-3 py-3 text-center font-medium text-muted-foreground">
                        Q{index + 1}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">ქულა</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground sm:px-6">სტატუსი</th>
                  </tr>
                </thead>
                <tbody>
                  {session.candidates.map((candidate) => {
                    const isChecked = checkedCandidateIds.includes(candidate.candidateId)
                    const isActive = candidate.candidateId === selectedCandidateId

                    return (
                      <tr
                        key={candidate.candidateId}
                        className={`cursor-pointer border-b border-border/40 transition-colors ${
                          isActive ? "bg-primary/5" : "hover:bg-secondary/20"
                        }`}
                        onClick={() => setSelectedCandidateId(candidate.candidateId)}
                      >
                        <td className="px-4 py-4 sm:px-6">
                          <button
                            type="button"
                            aria-label="კანდიდატის არჩევა"
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleCandidateSelection(candidate.candidateId)
                            }}
                            className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                              isChecked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card"
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-4 font-medium text-foreground sm:px-6">
                          {candidate.firstName} {candidate.lastNameInitial}.
                        </td>
                        {session.questions.map((_, index) => (
                          <td key={`${candidate.candidateId}-q-${index}`} className="px-3 py-4 text-center">
                            <ResponseCell
                              passed={candidate.responses[index]?.passed}
                              status={candidate.status}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-4 tabular-nums text-foreground sm:px-6">
                          {candidate.status === "completed"
                            ? `${candidate.passedCount}/${candidate.totalCount}`
                            : "—"}
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              candidate.status === "completed"
                                ? candidate.passedCount === candidate.totalCount
                                  ? "bg-primary/10 text-primary"
                                  : "bg-destructive/10 text-destructive"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {STATUS_LABELS[candidate.status]}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-[0_12px_40px_-16px_rgba(20,24,40,0.14)] sm:p-6 xl:max-h-[min(70vh,720px)] xl:overflow-y-auto xl:no-scrollbar">
            <h2 className="text-lg font-semibold text-foreground">დეტალური პასუხები</h2>
            {selectedCandidate ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-secondary/30 px-4 py-4">
                  <p className="text-base font-semibold text-foreground">
                    {selectedCandidate.firstName} {selectedCandidate.lastName}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {STATUS_LABELS[selectedCandidate.status]}
                    {selectedCandidate.status === "completed"
                      ? ` · ${selectedCandidate.passedCount}/${selectedCandidate.totalCount} გაიარა`
                      : ""}
                  </p>
                </div>

                {selectedCandidate.status === "completed" ? (
                  selectedCandidate.responses.map((item, index) => (
                    <div key={`${selectedCandidate.candidateId}-${index}`} className="rounded-2xl border border-border/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{item.question}</p>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.passed
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {item.passed ? "გაიარა" : "ვერ გაიარა"}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="rounded-xl bg-secondary/40 px-3 py-2">
                          <p className="text-xs text-muted-foreground">სასურველი · {REQUIREMENT_LABELS[item.requirement]}</p>
                          <p className="mt-1 leading-6 text-foreground">{item.preferred_answer}</p>
                        </div>
                        <div className="rounded-xl bg-secondary/40 px-3 py-2">
                          <p className="text-xs text-muted-foreground">კანდიდატის პასუხი</p>
                          <p className="mt-1 leading-6 text-foreground">{item.candidate_answer}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    კანდიდატი ჯერ არ დაუსვამს კითხვებს.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">აირჩიე კანდიდატი მატრიციდან.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
