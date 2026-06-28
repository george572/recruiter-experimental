export interface LiveInterviewQuestion {
  question: string
  answer_criteria: string
  requirement: "required" | "preferable"
}

export interface LiveInterviewScreeningPayload {
  invitation_text: string
  questions: LiveInterviewQuestion[]
}

export interface LiveInterviewInvitationResponse {
  invitationId: string
}

export type LiveInterviewStatus = "pending" | "in_progress" | "completed"

export interface LiveInterviewResponseItem {
  question: string
  preferred_answer: string
  candidate_answer: string
  passed: boolean
  requirement?: "required" | "preferable"
}

export interface LiveInterviewTranscriptItem {
  role?: string
  content?: string
  text?: string
}

export interface LiveInterviewDonePayload {
  ok?: boolean
  invitationId?: string
  status: LiveInterviewStatus
  user_uid?: string
  invitation_text?: string
  questions?: LiveInterviewQuestion[]
  responses: LiveInterviewResponseItem[]
  transcript?: LiveInterviewTranscriptItem[]
  completed_at?: string
}

export interface WatchLiveInterviewCallbacks {
  onStatus: (status: LiveInterviewStatus) => void
  onDone: (result: LiveInterviewDonePayload) => void
  onError: (error: unknown) => void
}

const HARDCODED_USER_UID = "107467043369155554152"

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
}

export async function submitLiveInterviewScreening(
  payload: LiveInterviewScreeningPayload,
): Promise<LiveInterviewInvitationResponse> {
  const response = await fetch(`${getApiBaseUrl()}/dashboard/live-interview-screening`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_uid: HARDCODED_USER_UID,
      ...payload,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to submit live interview screening")
  }

  const data = (await response.json()) as { invitationId?: string }
  if (!data.invitationId) {
    throw new Error("Invitation ID missing from response")
  }

  return { invitationId: data.invitationId }
}

export function watchLiveInterviewScreening(
  invitationId: string,
  callbacks: WatchLiveInterviewCallbacks,
): () => void {
  const es = new EventSource(
    `${getApiBaseUrl()}/dashboard/live-interview-screening/${invitationId}/watch`,
  )

  const handleStatus = (event: MessageEvent) => {
    const payload = JSON.parse(event.data) as { status: LiveInterviewStatus }
    callbacks.onStatus(payload.status)
  }

  const handleDone = (event: MessageEvent) => {
    const result = JSON.parse(event.data) as LiveInterviewDonePayload
    es.close()
    callbacks.onDone(result)
  }

  const handleError = (event: Event) => {
    if ("data" in event && typeof (event as MessageEvent).data === "string" && (event as MessageEvent).data) {
      try {
        callbacks.onError(JSON.parse((event as MessageEvent).data))
      } catch {
        callbacks.onError((event as MessageEvent).data)
      }
      es.close()
    }
  }

  es.addEventListener("status", handleStatus)
  es.addEventListener("done", handleDone)
  es.addEventListener("error", handleError)

  return () => es.close()
}
