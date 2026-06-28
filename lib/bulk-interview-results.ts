import { generateCandidates, type Candidate } from "@/lib/candidates"

export interface BulkInviteQuestion {
  question: string
  preferredAnswer: string
  priority: "mandatory" | "preferable"
}

export interface CandidateInterviewAnswer {
  question: string
  preferred_answer: string
  candidate_answer: string
  passed: boolean
  requirement: "required" | "preferable"
}

export interface CandidateInterviewResult {
  candidateId: string
  firstName: string
  lastName: string
  lastNameInitial: string
  status: "pending" | "in_progress" | "completed"
  responses: CandidateInterviewAnswer[]
  passedCount: number
  totalCount: number
  completedAt?: string
}

export interface BulkInterviewResultsSession {
  invitationText: string
  questions: BulkInviteQuestion[]
  candidates: CandidateInterviewResult[]
  createdAt: string
}

export const BULK_INTERVIEW_RESULTS_KEY = "bulk-interview-results"
export const DEMO_BULK_CANDIDATE_COUNT = 20

const DEFAULT_DEMO_QUESTIONS: BulkInviteQuestion[] = [
  {
    question: "რამდენი წლის გამოცდილება გაქვთ ამ როლში?",
    preferredAnswer: "მინიმუმ 2 წელი",
    priority: "mandatory",
  },
  {
    question: "როდის შეგიძლიათ დაწყება?",
    preferredAnswer: "ერთი თვის განმავლობაში",
    priority: "mandatory",
  },
  {
    question: "იცოდით ინგლისურს სამუშაო დონეზე?",
    preferredAnswer: "თავისუფლად",
    priority: "preferable",
  },
]

const DEMO_ANSWERS = [
  "დიახ, მაქვს შესაბამისი გამოცდილება და მზად ვარ დაწყებისთვის.",
  "ბოლო 3 წელიწადში მსგავს პოზიციაზე ვმუშაობ და კომფორტულად ვგრძნობ თავს.",
  "შემიძლია ერთი კვირაში დავიწყო, თუ შეთავაზება მომეწონა.",
  "მაქვს საკმარისი გამოცდილება, მაგრამ ხელფასის დიაპაზონსაც ვუყურებ.",
  "კი, ამ მიმართულებით უკვე 2 წელი ვმუშაობ და რამდენიმე მსგავს პროექტი მაქვს ჩაბარებული.",
  "დიახ, მაგრამ მხოლოდ ნაწილობრივ ჰიბრიდულ ფორმატში.",
  "არა, ჯერ არ მაქვს ამ სფეროში პრაქტიკა, მაგრამ სწრაფად ვსწავლობ.",
  "მზად ვარ დაუყოვნებლივ დავიწყო, თუ პირობები მისაღები იქნება.",
]

function resolveDemoStatus(index: number): CandidateInterviewResult["status"] {
  if (index % 9 === 0 || index % 9 === 1) return "pending"
  if (index % 9 === 2 || index % 9 === 3) return "in_progress"
  return "completed"
}

function resolveDemoCandidates(selectedCandidates: Candidate[]): Candidate[] {
  const byId = new Map<string, Candidate>()
  selectedCandidates.forEach((candidate) => byId.set(candidate.id, candidate))

  let offset = 0
  while (byId.size < DEMO_BULK_CANDIDATE_COUNT) {
    for (const candidate of generateCandidates(DEMO_BULK_CANDIDATE_COUNT, offset)) {
      if (byId.size >= DEMO_BULK_CANDIDATE_COUNT) break
      if (!byId.has(candidate.id)) byId.set(candidate.id, candidate)
    }
    offset += DEMO_BULK_CANDIDATE_COUNT
  }

  return Array.from(byId.values()).slice(0, DEMO_BULK_CANDIDATE_COUNT)
}

function hashSeed(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function buildResponses(
  candidateId: string,
  questions: BulkInviteQuestion[],
  status: CandidateInterviewResult["status"],
  index: number,
): CandidateInterviewAnswer[] {
  if (status !== "completed" || questions.length === 0) return []

  const seed = hashSeed(candidateId)
  const passBias = [0, 1, 2, 4, 6, 8][index % 6]

  return questions.map((item, questionIndex) => {
    const passed = (seed + questionIndex * 11 + passBias) % 10 > 2
    return {
      question: item.question,
      preferred_answer: item.preferredAnswer,
      candidate_answer: DEMO_ANSWERS[(seed + questionIndex + index) % DEMO_ANSWERS.length],
      passed,
      requirement: item.priority === "mandatory" ? "required" : "preferable",
    }
  })
}

export function buildDemoBulkInterviewResults(
  candidates: Candidate[],
  invitationText: string,
  questions: BulkInviteQuestion[],
): BulkInterviewResultsSession {
  const resolvedQuestions = questions.length > 0 ? questions : DEFAULT_DEMO_QUESTIONS
  const resolvedCandidates = resolveDemoCandidates(candidates)

  const enriched = resolvedCandidates.map((candidate, index) => {
    const seed = hashSeed(candidate.id)
    const status = resolveDemoStatus(index)
    const responses = buildResponses(candidate.id, resolvedQuestions, status, index)
    const passedCount = responses.filter((item) => item.passed).length

    return {
      candidateId: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      lastNameInitial: candidate.lastNameInitial,
      status,
      responses,
      passedCount,
      totalCount: resolvedQuestions.length,
      completedAt:
        status === "completed"
          ? new Date(Date.now() - (seed % 72) * 60 * 60 * 1000).toISOString()
          : undefined,
    }
  })

  return {
    invitationText,
    questions: resolvedQuestions,
    candidates: enriched,
    createdAt: new Date().toISOString(),
  }
}

export function saveBulkInterviewResults(session: BulkInterviewResultsSession) {
  sessionStorage.setItem(BULK_INTERVIEW_RESULTS_KEY, JSON.stringify(session))
}

export function loadBulkInterviewResults(): BulkInterviewResultsSession | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(BULK_INTERVIEW_RESULTS_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as BulkInterviewResultsSession
  } catch {
    return null
  }
}

export function getQuestionStats(session: BulkInterviewResultsSession) {
  return session.questions.map((question, index) => {
    const completed = session.candidates.filter((candidate) => candidate.status === "completed")
    const responses = completed
      .map((candidate) => candidate.responses[index])
      .filter((item): item is CandidateInterviewAnswer => Boolean(item))

    const passed = responses.filter((item) => item.passed).length
    const failed = responses.filter((item) => !item.passed).length
    const pending = session.candidates.length - completed.length

    return {
      question: question.question,
      requirement: question.priority === "mandatory" ? "required" : "preferable",
      passed,
      failed,
      pending,
      total: session.candidates.length,
    }
  }) as Array<{
    question: string
    requirement: "required" | "preferable"
    passed: number
    failed: number
    pending: number
    total: number
  }>
}

export function getOverviewStats(session: BulkInterviewResultsSession) {
  const completed = session.candidates.filter((candidate) => candidate.status === "completed")
  const pending = session.candidates.filter((candidate) => candidate.status === "pending").length
  const inProgress = session.candidates.filter((candidate) => candidate.status === "in_progress").length
  const passedAll = completed.filter(
    (candidate) => candidate.passedCount === candidate.totalCount && candidate.totalCount > 0,
  ).length
  const failedSome = completed.filter(
    (candidate) => candidate.passedCount < candidate.totalCount && candidate.totalCount > 0,
  ).length

  return {
    invited: session.candidates.length,
    completed: completed.length,
    pending,
    inProgress,
    passedAll,
    failedSome,
  }
}
