import { cn } from "@/lib/utils"

const descriptionBodyClass =
  "mt-3 text-[14px] leading-7 break-words text-foreground/85 [overflow-wrap:anywhere] " +
  "[&_p]:mb-3 [&_p:last-child]:mb-0 " +
  "[&_br]:leading-7 " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 " +
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 " +
  "[&_li]:leading-7 " +
  "[&_b]:font-semibold [&_strong]:font-semibold " +
  "[&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold " +
  "[&_h2]:mb-2 [&_h2]:text-[15px] [&_h2]:font-semibold " +
  "[&_h3]:mb-2 [&_h3]:text-[14px] [&_h3]:font-semibold " +
  "[&_h4]:mb-1.5 [&_h4]:text-[14px] [&_h4]:font-semibold"

export function JobDescriptionBody({
  html,
  text,
  empty,
  className,
}: {
  html?: string | null
  text?: string | null
  empty?: string
  className?: string
}) {
  const rich = (html || "").trim()
  const plain = (text || "").trim()

  if (rich) {
    return (
      <div
        className={cn(descriptionBodyClass, className)}
        dangerouslySetInnerHTML={{ __html: rich }}
      />
    )
  }

  if (plain) {
    return (
      <div className={cn(descriptionBodyClass, "whitespace-pre-wrap", className)}>
        {plain}
      </div>
    )
  }

  return (
    <p className={cn("mt-3 text-[14px] leading-7 text-muted-foreground", className)}>
      {empty ||
        "სრული აღწერა ხელმისაწვდომია წყაროს გვერდზე — გახსენი განაცხადის ღილაკით."}
    </p>
  )
}
