import { ThumbsDown, ThumbsUp } from "lucide-react"
import { formatInt } from "@/lib/format"
import { cn } from "@/lib/utils"

type JobReactionCountsProps = {
  likes?: number | null
  dislikes?: number | null
  className?: string
  /** Compact for dense mobile cards / table cells */
  size?: "sm" | "md"
}

/** Read-only thumbs + counts (list / table). Voting happens on the detail page. */
export function JobReactionCounts({
  likes = 0,
  dislikes = 0,
  className,
  size = "sm",
}: JobReactionCountsProps) {
  const likeCount = Math.max(0, Number(likes) || 0)
  const dislikeCount = Math.max(0, Number(dislikes) || 0)
  const iconClass = size === "md" ? "size-3.5" : "size-3"
  const textClass = size === "md" ? "text-[12px]" : "text-[11px]"

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 tabular-nums text-muted-foreground",
        textClass,
        className
      )}
      aria-label={`მოწონება ${formatInt(likeCount)}, არ მომწონს ${formatInt(dislikeCount)}`}
    >
      <span className="inline-flex items-center gap-1">
        <ThumbsUp className={iconClass} strokeWidth={1.75} aria-hidden />
        <span>{formatInt(likeCount)}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <ThumbsDown className={iconClass} strokeWidth={1.75} aria-hidden />
        <span>{formatInt(dislikeCount)}</span>
      </span>
    </div>
  )
}
