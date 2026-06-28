"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Loader2, Plus, X } from "lucide-react"
import { submitLiveInterviewScreening } from "@/lib/live-interview"
import type { BulkInviteQuestion } from "@/lib/bulk-interview-results"

type QuestionPriority = "mandatory" | "preferable"
type InviteStatus = "idle" | "loading" | "sent" | "success"

export interface InviteFormPayload {
  invitationText: string
  questions: BulkInviteQuestion[]
}

const DEFAULT_INVITATION_TEXT =
  "გიწვევთ კონსულტანტის პოზიციაზე, ქალაქ თბილისში, დევიძის 11 ნომერში არსებულ მაღაზიაში, სამუშაო გრაფიკია 10-დან 7-მდე, შაბათკვირას დასვენება."

interface InviteQuestion {
  id: string
  question: string
  preferredAnswer: string
  priority: QuestionPriority
}

interface InviteCandidateModalProps {
  open: boolean
  onClose: () => void
  onInvited?: (invitationId: string) => void
  onComplete?: (payload: InviteFormPayload) => void
  selectedCount?: number
  demoMode?: boolean
}

const inputClassName =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/20"

const textareaClassName =
  "w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/20"

function createQuestion(): InviteQuestion {
  return {
    id: crypto.randomUUID(),
    question: "",
    preferredAnswer: "",
    priority: "mandatory",
  }
}

export function InviteCandidateModal({
  open,
  onClose,
  onInvited,
  onComplete,
  selectedCount,
  demoMode = false,
}: InviteCandidateModalProps) {
  const [questions, setQuestions] = useState<InviteQuestion[]>([createQuestion()])
  const [invitationText, setInvitationText] = useState(DEFAULT_INVITATION_TEXT)
  const [isVisible, setIsVisible] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("idle")
  const inviteTimeoutsRef = useRef<number[]>([])

  function clearInviteTimeouts() {
    inviteTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout))
    inviteTimeoutsRef.current = []
  }

  function queueInviteTimeout(callback: () => void, delay: number) {
    const timeout = window.setTimeout(callback, delay)
    inviteTimeoutsRef.current.push(timeout)
  }

  useEffect(() => {
    if (!open) {
      setIsVisible(false)
      clearInviteTimeouts()
      setInviteStatus("idle")
      return
    }

    setInviteStatus("idle")
    setInvitationText(DEFAULT_INVITATION_TEXT)
    const frame = window.requestAnimationFrame(() => setIsVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    return () => clearInviteTimeouts()
  }, [])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  if (!open) return null

  function updateQuestion(id: string, patch: Partial<InviteQuestion>) {
    setQuestions((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion()])
  }

  function handleClose() {
    clearInviteTimeouts()
    setInviteStatus("idle")
    setIsVisible(false)
    window.setTimeout(onClose, 500)
  }

  async function handleInvite() {
    if (inviteStatus !== "idle") return

    clearInviteTimeouts()
    setInviteStatus("loading")

    try {
      if (demoMode) {
        await new Promise((resolve) => window.setTimeout(resolve, 900))
      }

      const formPayload: InviteFormPayload = {
        invitationText,
        questions: questions.map((item) => ({
          question: item.question,
          preferredAnswer: item.preferredAnswer,
          priority: item.priority,
        })),
      }

      const invitationId = demoMode
        ? `demo-${crypto.randomUUID()}`
        : (
            await submitLiveInterviewScreening({
              invitation_text: invitationText,
              questions: questions.map((item) => ({
                question: item.question,
                answer_criteria: item.preferredAnswer,
                requirement: item.priority === "mandatory" ? "required" : "preferable",
              })),
            })
          ).invitationId

      setInviteStatus("sent")
      onInvited?.(invitationId)
      onComplete?.(formPayload)
      queueInviteTimeout(() => {
        setInviteStatus("success")
        handleClose()
      }, 1200)
    } catch {
      setInviteStatus("idle")
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="მოდალის დახურვა"
        className={`fixed inset-0 z-50 cursor-default bg-foreground/25 backdrop-blur-md transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <div
          className={`flex h-[58vh] w-full max-w-[680px] min-h-[400px] flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_12px_40px_-16px_rgba(20,24,40,0.14),0_24px_64px_-24px_rgba(20,24,40,0.2)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.97] opacity-0"
          }`}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
            <h2 className="pr-2 text-base font-semibold leading-snug text-foreground sm:text-lg">
              რა კითხვები დაუსვას AI-მ კანდიდატს?
              {selectedCount && selectedCount > 1 ? (
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  {selectedCount} არჩეული კანდიდატი
                </span>
              ) : null}
            </h2>
            <button
              type="button"
              aria-label="მოდალის დახურვა"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="invitation-text" className="text-sm font-medium text-foreground">
                  მოწვევის ტექსტი
                </label>
                <textarea
                  id="invitation-text"
                  value={invitationText}
                  onChange={(event) => setInvitationText(event.target.value)}
                  rows={4}
                  className={textareaClassName}
                />
              </div>

              {questions.map((item, index) => (
                <div key={item.id} className="space-y-3 rounded-2xl border border-border/60 p-4">
                  <p className="text-sm font-medium text-foreground">კითხვა {index + 1}</p>

                  <div className="flex flex-col gap-2">
                    <label htmlFor={`question-${item.id}`} className="text-sm font-medium text-foreground">
                      კითხვა
                    </label>
                    <input
                      id={`question-${item.id}`}
                      type="text"
                      value={item.question}
                      onChange={(event) => updateQuestion(item.id, { question: event.target.value })}
                      placeholder="მაგ. როდის შეგიძლიათ დაწყება?"
                      className={inputClassName}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor={`answer-${item.id}`} className="text-sm font-medium text-foreground">
                      სასურველი პასუხი
                    </label>
                    <input
                      id={`answer-${item.id}`}
                      type="text"
                      value={item.preferredAnswer}
                      onChange={(event) => updateQuestion(item.id, { preferredAnswer: event.target.value })}
                      placeholder="მაგ. ერთი თვის განმავლობაში"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">სავალდებულო თუ სასურველი</p>
                    <div className="grid grid-cols-2 rounded-full border border-border p-1">
                      <button
                        type="button"
                        onClick={() => updateQuestion(item.id, { priority: "mandatory" })}
                        className={`cursor-pointer rounded-full px-3 py-2 text-center text-xs font-medium transition-colors sm:text-sm ${
                          item.priority === "mandatory"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        სავალდებულო
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestion(item.id, { priority: "preferable" })}
                        className={`cursor-pointer rounded-full px-3 py-2 text-center text-xs font-medium transition-colors sm:text-sm ${
                          item.priority === "preferable"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        სასურველი
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center pb-1">
                <button
                  type="button"
                  aria-label="კითხვის დამატება"
                  onClick={addQuestion}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-center border-t border-border/60 px-5 py-4 sm:px-6 sm:py-5">
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviteStatus !== "idle"}
              aria-live="polite"
              className="inline-flex min-h-11 min-w-[180px] cursor-pointer items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-default disabled:hover:opacity-100"
            >
              {inviteStatus === "loading" && (
                <Loader2 className="h-5 w-5 animate-spin [animation-duration:0.4s]" aria-hidden="true" />
              )}
              {inviteStatus === "sent" && "მოწვევა გაგზავნილია"}
              {inviteStatus === "success" && <Check className="h-5 w-5" aria-hidden="true" />}
              {inviteStatus === "idle" && "მოწვევა"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
