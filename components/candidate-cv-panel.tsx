"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Lock, Mail, MapPin, Phone } from "lucide-react"
import { InterviewResultsPanel } from "@/components/interview-results-panel"
import { InviteCandidateModal } from "@/components/invite-candidate-modal"
import type { Candidate } from "@/lib/candidates"
import {
  watchLiveInterviewScreening,
  type LiveInterviewDonePayload,
  type LiveInterviewStatus,
} from "@/lib/live-interview"

interface CandidateCvPanelProps {
  candidate: Candidate
}

function CvSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h3>
      {children}
    </section>
  )
}

function PersonalInfoSection({
  candidate,
  unlocked,
  onUnlock,
}: {
  candidate: Candidate
  unlocked: boolean
  onUnlock: () => void
}) {
  const contactCardClassName =
    "flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3.5 transition-colors"
  const phoneCard = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
        <Phone className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">ტელეფონი</p>
        <p className={`truncate text-sm font-medium text-foreground ${unlocked ? "" : "blur-sm"}`}>
          {candidate.phone}
        </p>
      </div>
    </>
  )
  const emailCard = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
        <Mail className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">ელფოსტა</p>
        <p className={`truncate text-sm font-medium text-foreground ${unlocked ? "" : "blur-sm"}`}>
          {candidate.email}
        </p>
      </div>
    </>
  )

  return (
    <div className="relative overflow-hidden rounded-3xl bg-secondary/50 p-6 sm:p-7">
      <div className={unlocked ? "" : "pointer-events-none select-none blur-md"}>
        <div>
          <p className="text-2xl font-semibold leading-tight text-foreground">
            {candidate.firstName}{" "}
            <span className={unlocked ? "" : "inline-block blur-sm"}>
              {unlocked ? candidate.lastName : `${candidate.lastNameInitial}.`}
            </span>
          </p>
          <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="leading-6">
              <p>
                {candidate.city}, {candidate.district}
              </p>
              <p className={unlocked ? "" : "blur-sm"}>{candidate.address}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {unlocked ? (
            <a href={`tel:${candidate.phone.replace(/\s/g, "")}`} className={`${contactCardClassName} hover:border-border`}>
              {phoneCard}
            </a>
          ) : (
            <div className={contactCardClassName}>{phoneCard}</div>
          )}
          {unlocked ? (
            <a href={`mailto:${candidate.email}`} className={`${contactCardClassName} hover:border-border`}>
              {emailCard}
            </a>
          ) : (
            <div className={contactCardClassName}>{emailCard}</div>
          )}
        </div>
      </div>

      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30 p-4 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={onUnlock}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_rgba(20,24,40,0.35)] transition-opacity hover:opacity-90"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            კანდიდატის განბლოკვა
          </button>
        </div>
      )}
    </div>
  )
}

export function CandidateCvPanel({ candidate }: CandidateCvPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stopWatchingRef = useRef<(() => void) | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [interviewStatus, setInterviewStatus] = useState<LiveInterviewStatus | null>(null)
  const [interviewResult, setInterviewResult] = useState<LiveInterviewDonePayload | null>(null)
  const [watchError, setWatchError] = useState<string | null>(null)

  const stopWatching = useCallback(() => {
    stopWatchingRef.current?.()
    stopWatchingRef.current = null
  }, [])

  const clearInterviewState = useCallback(() => {
    stopWatching()
    setInterviewStatus(null)
    setInterviewResult(null)
    setWatchError(null)
  }, [stopWatching])

  const startWatching = useCallback(
    (invitationId: string) => {
      stopWatching()
      setInterviewResult(null)
      setWatchError(null)
      setInterviewStatus("pending")

      stopWatchingRef.current = watchLiveInterviewScreening(invitationId, {
        onStatus: (status) => {
          setInterviewStatus(status)
        },
        onDone: (result) => {
          setInterviewResult(result)
          setInterviewStatus("completed")
          scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
        },
        onError: (error) => {
          const message =
            typeof error === "string"
              ? error
              : error && typeof error === "object" && "message" in error
                ? String(error.message)
                : "ინტერვიუს მონიტორინგი ვერ მოხერხდა"
          setWatchError(message)
        },
      })
    },
    [stopWatching],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    setUnlocked(false)
    clearInterviewState()
  }, [candidate.id, clearInterviewState])

  useEffect(() => {
    return () => stopWatching()
  }, [stopWatching])

  const hasInterviewPanel = interviewStatus !== null || interviewResult !== null || watchError !== null

  return (
    <article className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_12px_40px_-16px_rgba(20,24,40,0.14)]">
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-6 pb-24 sm:p-8 sm:pb-28">
        <div className="space-y-8">
          {hasInterviewPanel && (
            <InterviewResultsPanel
              status={interviewStatus}
              result={interviewResult}
              error={watchError}
              onDismiss={interviewResult ? clearInterviewState : undefined}
            />
          )}

          <CvSection title="პირადი ინფორმაცია">
            <PersonalInfoSection
              candidate={candidate}
              unlocked={unlocked}
              onUnlock={() => setUnlocked(true)}
            />
          </CvSection>

          <CvSection title="სამუშაო გამოცდილება">
            <div className="space-y-4">
              {candidate.workExperience.map((item) => (
                <div
                  key={`${item.company}-${item.period}`}
                  className="rounded-2xl border border-border/60 bg-secondary/30 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">{item.role}</p>
                      <p className="text-sm text-muted-foreground">{item.company}</p>
                    </div>
                    <p className="shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">{item.period}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground/90">{item.description}</p>
                </div>
              ))}
            </div>
          </CvSection>

          <CvSection title="განათლება">
            <div className="space-y-3">
              {candidate.education.map((item) => (
                <div
                  key={`${item.institution}-${item.period}`}
                  className="rounded-2xl border border-border/60 bg-secondary/30 p-4 sm:p-5"
                >
                  <p className="text-base font-semibold text-foreground">{item.degree}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.institution}</p>
                  <p className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">{item.period}</p>
                </div>
              ))}
            </div>
          </CvSection>

          <CvSection title="ენები">
            <div className="flex flex-wrap gap-2">
              {candidate.languages.map((language) => (
                <div
                  key={`${language.name}-${language.level}`}
                  className="rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3"
                >
                  <p className="text-base font-medium text-foreground">{language.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{language.level}</p>
                </div>
              ))}
            </div>
          </CvSection>

          <CvSection title="სერტიფიკატები">
            <div className="space-y-3">
              {candidate.certifications.map((item) => (
                <div
                  key={`${item.name}-${item.year}`}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 sm:px-5 sm:py-4"
                >
                  <div>
                    <p className="text-base font-medium text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.issuer}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">{item.year}</span>
                </div>
              ))}
            </div>
          </CvSection>

          <CvSection title="დამატებითი ინფორმაცია">
            <p className="rounded-2xl border border-border/60 bg-secondary/30 p-4 text-sm leading-6 text-foreground sm:p-5 sm:text-base sm:leading-7">
              {candidate.additionalInfo}
            </p>
          </CvSection>
        </div>
      </div>

      {unlocked && (
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="absolute bottom-6 left-1/2 z-[5] -translate-x-1/2 cursor-pointer rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_rgba(20,24,40,0.35)] transition-opacity hover:opacity-90"
        >
          მოიწვიე
        </button>
      )}

      <InviteCandidateModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(invitationId) => {
          startWatching(invitationId)
        }}
      />
    </article>
  )
}
