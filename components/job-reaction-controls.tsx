"use client"

import { useEffect, useRef, useState } from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"
import { formatInt } from "@/lib/format"
import {
  getStoredJobReaction,
  setStoredJobReaction,
  type JobReactionVote,
} from "@/lib/job-reactions"
import { cn } from "@/lib/utils"

type JobReactionControlsProps = {
  jobId: string
  likes?: number | null
  dislikes?: number | null
  className?: string
}

/**
 * Interactive thumbs on the job detail page.
 * Persists the visitor's choice in localStorage and syncs counts via API.
 */
export function JobReactionControls({
  jobId,
  likes = 0,
  dislikes = 0,
  className,
}: JobReactionControlsProps) {
  const [likeCount, setLikeCount] = useState(Math.max(0, Number(likes) || 0))
  const [dislikeCount, setDislikeCount] = useState(
    Math.max(0, Number(dislikes) || 0)
  )
  const [vote, setVote] = useState<JobReactionVote | null>(null)
  const [ready, setReady] = useState(false)
  const inFlight = useRef(false)

  useEffect(() => {
    setLikeCount(Math.max(0, Number(likes) || 0))
    setDislikeCount(Math.max(0, Number(dislikes) || 0))
  }, [jobId, likes, dislikes])

  useEffect(() => {
    setVote(getStoredJobReaction(jobId))
    setReady(true)
  }, [jobId])

  async function applyVote(next: JobReactionVote | null) {
    if (!ready || inFlight.current) return
    const previous = vote
    if (previous === next) return

    const prevLikes = likeCount
    const prevDislikes = dislikeCount

    // Optimistic UI
    setVote(next)
    setStoredJobReaction(jobId, next)
    setLikeCount((n) => {
      let v = n
      if (previous === "like") v -= 1
      if (next === "like") v += 1
      return Math.max(0, v)
    })
    setDislikeCount((n) => {
      let v = n
      if (previous === "dislike") v -= 1
      if (next === "dislike") v += 1
      return Math.max(0, v)
    })

    if (!jobId.includes(":")) return

    inFlight.current = true
    try {
      const res = await fetch(
        `/api/jobs/${encodeURIComponent(jobId)}/reaction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote: next, previous }),
        }
      )
      if (!res.ok) throw new Error("reaction_failed")
      const data = (await res.json()) as {
        like_count?: number
        dislike_count?: number
        vote?: JobReactionVote | null
      }
      if (Number.isFinite(Number(data.like_count))) {
        setLikeCount(Math.max(0, Number(data.like_count)))
      }
      if (Number.isFinite(Number(data.dislike_count))) {
        setDislikeCount(Math.max(0, Number(data.dislike_count)))
      }
      const serverVote =
        data.vote === "like" || data.vote === "dislike" ? data.vote : null
      setVote(serverVote)
      setStoredJobReaction(jobId, serverVote)
    } catch {
      setVote(previous)
      setStoredJobReaction(jobId, previous)
      setLikeCount(prevLikes)
      setDislikeCount(prevDislikes)
    } finally {
      inFlight.current = false
    }
  }

  function onLike() {
    void applyVote(vote === "like" ? null : "like")
  }

  function onDislike() {
    void applyVote(vote === "dislike" ? null : "dislike")
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={onLike}
        aria-pressed={vote === "like"}
        aria-label="მოწონება"
        className={cn(
          "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border text-[13px] font-medium tabular-nums transition-colors",
          vote === "like"
            ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
        )}
      >
        <ThumbsUp className="size-4" strokeWidth={1.75} />
        {formatInt(likeCount)}
      </button>
      <button
        type="button"
        onClick={onDislike}
        aria-pressed={vote === "dislike"}
        aria-label="არ მომწონს"
        className={cn(
          "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border text-[13px] font-medium tabular-nums transition-colors",
          vote === "dislike"
            ? "border-rose-600/40 bg-rose-500/10 text-rose-700 dark:text-rose-400"
            : "border-border/60 bg-card text-muted-foreground hover:border-border hover:text-foreground"
        )}
      >
        <ThumbsDown className="size-4" strokeWidth={1.75} />
        {formatInt(dislikeCount)}
      </button>
    </div>
  )
}
