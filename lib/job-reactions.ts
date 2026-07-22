export type JobReactionVote = "like" | "dislike"

const STORAGE_KEY = "recruiter-ge-job-reactions"

type ReactionMap = Record<string, JobReactionVote>

function readMap(): ReactionMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    const out: ReactionMap = {}
    for (const [id, vote] of Object.entries(parsed as Record<string, unknown>)) {
      if (vote === "like" || vote === "dislike") out[id] = vote
    }
    return out
  } catch {
    return {}
  }
}

function writeMap(map: ReactionMap) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore quota / private mode
  }
}

export function getStoredJobReaction(jobId: string): JobReactionVote | null {
  return readMap()[jobId] ?? null
}

export function setStoredJobReaction(
  jobId: string,
  vote: JobReactionVote | null
) {
  const map = readMap()
  if (vote == null) delete map[jobId]
  else map[jobId] = vote
  writeMap(map)
}
