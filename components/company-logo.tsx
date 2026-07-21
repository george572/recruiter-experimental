import Image from "next/image"
import { cn } from "@/lib/utils"

function companyInitial(company: string | null | undefined) {
  const text = String(company || "").trim()
  if (!text) return "?"
  return text[0]!.toUpperCase()
}

export function CompanyLogo({
  src,
  company,
  size = 40,
  className,
  imgClassName,
}: {
  src?: string | null
  company?: string | null
  size?: number
  className?: string
  imgClassName?: string
}) {
  const url = typeof src === "string" ? src.trim() : ""
  const isGeneric =
    !url ||
    url === "/placeholder.svg" ||
    /google\.com\/s2\/favicons/i.test(url)

  if (!isGeneric) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary",
          className
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src={url}
          alt=""
          width={size}
          height={size}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-semibold text-foreground/70",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {companyInitial(company)}
    </div>
  )
}
