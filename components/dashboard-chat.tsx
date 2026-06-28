"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, Loader2 } from "lucide-react"
import Link from "next/link"
import { CandidateCard } from "@/components/candidate-card"
import { CandidateCvPanel } from "@/components/candidate-cv-panel"
import { InviteCandidateModal, type InviteFormPayload } from "@/components/invite-candidate-modal"
import { buildDemoBulkInterviewResults, saveBulkInterviewResults } from "@/lib/bulk-interview-results"
import { generateCandidates, type Candidate } from "@/lib/candidates"

const BATCH_SIZE = 10
const STAGGER_MS = 90

type Phase = "idle" | "searching" | "results"

export function DashboardChat() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [submittedQuery, setSubmittedQuery] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [batchOffset, setBatchOffset] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(false)
  const [chatInputVisible, setChatInputVisible] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [checkedCandidateIds, setCheckedCandidateIds] = useState<string[]>([])
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const isSearching = phase === "searching"
  const hasResults = phase === "results"

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChatInputVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (phase !== "idle" || !chatInputVisible) return
    const timeout = window.setTimeout(() => {
      textareaRef.current?.focus()
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [phase, chatInputVisible])

  useEffect(() => {
    if (!isSearching) return
    const timeout = window.setTimeout(() => {
      const initial = generateCandidates(BATCH_SIZE, 0)
      setCandidates(initial)
      setSelectedCandidateId(initial[0]?.id ?? null)
      setBatchOffset(BATCH_SIZE)
      setPhase("results")
    }, 3000)
    return () => window.clearTimeout(timeout)
  }, [isSearching])

  useEffect(() => {
    if (!hasResults) return
    setQuery("")
    const timeout = window.setTimeout(() => {
      textareaRef.current?.focus()
    }, 400)
    return () => window.clearTimeout(timeout)
  }, [hasResults])

  useEffect(() => {
    if (!hasResults) {
      setInfiniteScrollEnabled(false)
      return
    }
    const timeout = window.setTimeout(() => setInfiniteScrollEnabled(true), 1200)
    return () => window.clearTimeout(timeout)
  }, [hasResults])

  const loadMore = useCallback(() => {
    if (isLoadingMore) return
    setIsLoadingMore(true)
    window.setTimeout(() => {
      setCandidates((current) => [...current, ...generateCandidates(BATCH_SIZE, batchOffset)])
      setBatchOffset((current) => current + BATCH_SIZE)
      setIsLoadingMore(false)
    }, 300)
  }, [batchOffset, isLoadingMore])

  useEffect(() => {
    if (!hasResults) return
    const sentinel = loadMoreRef.current
    const root = scrollContainerRef.current
    if (!sentinel || !root) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && infiniteScrollEnabled) loadMore()
      },
      { root, rootMargin: "120px" },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasResults, infiniteScrollEnabled, loadMore, candidates.length])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (phase === "idle") {
      if (!query.trim()) return
      setSubmittedQuery(query.trim())
      setPhase("searching")
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ?? candidates[0] ?? null

  function toggleSelectionMode() {
    setSelectionMode((current) => {
      if (current) setCheckedCandidateIds([])
      return !current
    })
  }

  function handleCandidateClick(candidateId: string) {
    if (selectionMode) {
      setCheckedCandidateIds((current) =>
        current.includes(candidateId)
          ? current.filter((id) => id !== candidateId)
          : [...current, candidateId],
      )
    }
    setSelectedCandidateId(candidateId)
  }

  function handleBulkInviteComplete(payload: InviteFormPayload) {
    const selectedCandidates = candidates.filter((candidate) =>
      checkedCandidateIds.includes(candidate.id),
    )
    const session = buildDemoBulkInterviewResults(
      selectedCandidates,
      payload.invitationText,
      payload.questions,
    )

    saveBulkInterviewResults(session)
    setBulkInviteOpen(false)
    setCheckedCandidateIds([])
    setSelectionMode(false)
    router.push("/dashboard/candidate-interview-results")
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden px-[25px] py-10 lg:px-[60px]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[480px] translate-x-1/4 translate-y-1/4 rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <Link
        href="/"
        className="absolute left-[25px] top-5 z-10 flex h-8 items-center justify-center rounded-md bg-primary px-3 transition-opacity hover:opacity-90 lg:left-[60px] lg:top-5"
      >
        <span className="text-sm font-bold text-primary-foreground">Recruiter.ge</span>
      </Link>

      <div
        className={`flex min-h-0 flex-1 flex-col transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          phase !== "idle" ? "justify-start pt-14 sm:pt-16" : "items-center justify-center"
        }`}
      >
        {!hasResults && (
          <div
            className={`w-full shrink-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              phase !== "idle" ? "mx-auto max-w-[480px] sm:max-w-[520px]" : "max-w-[720px]"
            } ${
              chatInputVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <form
              onSubmit={handleSubmit}
              className={`w-full rounded-3xl border border-border/60 bg-card shadow-[0_12px_40px_-16px_rgba(20,24,40,0.14)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                phase !== "idle" ? "p-3 sm:p-4" : "p-5 sm:p-6"
              }`}
            >
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  readOnly={phase !== "idle"}
                  rows={phase !== "idle" ? 1 : 3}
                  placeholder="ვის ეძებ? რაც უფრო დეტალურად აღწერ, უფრო რელევანტურ კანდიდატებს ვიპოვი"
                  className={`w-full resize-none bg-transparent text-foreground outline-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground ${
                    phase !== "idle"
                      ? "min-h-[24px] text-sm leading-6 sm:min-h-[28px] sm:text-base sm:leading-7"
                      : "min-h-[88px] text-base leading-7 sm:min-h-[96px] sm:text-lg sm:leading-8"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || phase !== "idle"}
                  aria-label="გაგზავნა"
                  className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
                    phase !== "idle" ? "h-8 w-8" : "h-10 w-10 sm:h-11 sm:w-11"
                  }`}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {isSearching && (
          <div className="mt-10 flex flex-col items-center gap-6 sm:mt-12">
            <Loader2 className="h-20 w-20 animate-spin text-primary [animation-duration:0.4s] sm:h-24 sm:w-24" aria-hidden="true" />
            <p className="text-lg font-medium text-muted-foreground sm:text-xl">ვეძებ, დამელოდე...</p>
          </div>
        )}

        {hasResults && selectedCandidate && (
          <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4 sm:mt-6 lg:flex-row lg:gap-6">
            <div className="flex min-h-0 w-full flex-col lg:w-1/2">
              <p className="mb-3 text-sm leading-6 text-foreground sm:text-base sm:leading-7">{submittedQuery}</p>

              <form
                onSubmit={handleSubmit}
                className="refinement-input-enter w-full rounded-2xl border border-border/60 bg-card p-3 opacity-0 shadow-[0_8px_28px_-12px_rgba(20,24,40,0.12)] sm:p-4"
              >
                <div className="flex items-end gap-3">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="მითხარი დამატებითი ინსტრუქციები რის მიხედვითაც გავცხრილავ კადრებს"
                    className="min-h-[24px] w-full resize-none bg-transparent text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground sm:min-h-[28px] sm:text-base sm:leading-7"
                  />
                  <button
                    type="submit"
                    disabled={!query.trim()}
                    aria-label="გაგზავნა"
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5">
                <button
                  type="button"
                  onClick={toggleSelectionMode}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selectionMode
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-card text-foreground hover:border-border"
                  }`}
                >
                  მონიშვნა
                  {checkedCandidateIds.length > 0 ? ` (${checkedCandidateIds.length})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkInviteOpen(true)}
                  disabled={!selectionMode || checkedCandidateIds.length === 0}
                  className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  მოწვევა
                </button>
              </div>

              <div
                ref={scrollContainerRef}
                className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto sm:mt-5"
              >
              <div className="grid grid-cols-2 gap-3 pb-8 sm:gap-4">
                {candidates.map((candidate, index) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    animationDelayMs={(index % BATCH_SIZE) * STAGGER_MS}
                    selected={candidate.id === selectedCandidateId}
                    selectionMode={selectionMode}
                    checked={checkedCandidateIds.includes(candidate.id)}
                    onSelect={() => handleCandidateClick(candidate.id)}
                  />
                ))}
              </div>
              <div ref={loadMoreRef} className="flex h-12 items-center justify-center">
                {isLoadingMore && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground [animation-duration:0.4s]" aria-hidden="true" />
                )}
              </div>
              </div>
            </div>

            <div className="min-h-[420px] w-full lg:min-h-0 lg:h-full lg:w-1/2">
              <CandidateCvPanel candidate={selectedCandidate} />
            </div>
          </div>
        )}
      </div>

      <InviteCandidateModal
        open={bulkInviteOpen}
        onClose={() => setBulkInviteOpen(false)}
        onComplete={handleBulkInviteComplete}
        selectedCount={checkedCandidateIds.length}
        demoMode
      />
    </div>
  )
}
