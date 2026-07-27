"use client"

import { Suspense, useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-3T11JCESTD"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function analyticsTitle(pathname: string, searchParams: URLSearchParams): string {
  const q = (searchParams.get("q") || "").trim()
  if (pathname.startsWith("/search/") && q) {
    const pageRaw = Number(searchParams.get("page") || "1")
    const page =
      Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
    return page > 1
      ? `ძებნა: ${q} · გვერდი ${page} | Recruiter.ge`
      : `ძებნა: ${q} | Recruiter.ge`
  }
  return typeof document !== "undefined" ? document.title : "Recruiter.ge"
}

function sendPageView(pathname: string, searchParams: URLSearchParams) {
  if (typeof window.gtag !== "function") return false

  const qs = searchParams.toString()
  // Real /search/... routes — path only (GA Page path drops query strings).
  const pagePath = pathname.startsWith("/search/")
    ? pathname
    : qs
      ? `${pathname}?${qs}`
      : pathname || "/"
  const pageTitle = analyticsTitle(pathname, searchParams)
  const q = (searchParams.get("q") || "").trim()

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  })

  if (q || pathname.startsWith("/search/")) {
    const term =
      q ||
      decodeURIComponent(pathname.replace(/^\/search\//, "").split("/")[0] || "")
    if (term) {
      window.gtag("event", "search", {
        search_term: term,
        page_path: pagePath,
      })
    }
  }

  return true
}

function GaRouteListener() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const lastKeyRef = useRef<string>("")

  useEffect(() => {
    const key = `${pathname}?${searchKey}`
    if (key === lastKeyRef.current) return

    let cancelled = false
    let tries = 0

    const tick = () => {
      if (cancelled) return
      if (sendPageView(pathname, searchParams)) {
        lastKeyRef.current = key
        return
      }
      if (tries++ < 40) {
        window.setTimeout(tick, 100)
      }
    }

    tick()
    return () => {
      cancelled = true
    }
  }, [pathname, searchKey, searchParams])

  return null
}

/**
 * Google Analytics 4 (gtag.js) — production only.
 * Real /search/[slug] paths show as distinct rows in Realtime.
 */
export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production") return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `.trim()}
      </Script>
      <Suspense fallback={null}>
        <GaRouteListener />
      </Suspense>
    </>
  )
}
