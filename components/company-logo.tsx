"use client"

import { useState } from "react"
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
  const [failed, setFailed] = useState(false)

  if (!isGeneric && !failed) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 ring-1 ring-border/40",
          className
        )}
        style={{ width: size, height: size }}
      >
        {/* Plain img — jobs.ge assets are often tiny GIFs; contain + pad beats object-cover blur */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer-when-downgrade"
          className={cn(
            "max-h-full max-w-full object-contain",
            // Avoid upscaling 20px logo_icon GIFs into mushy circles
            "image-rendering-auto",
            imgClassName
          )}
          onError={() => setFailed(true)}
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
