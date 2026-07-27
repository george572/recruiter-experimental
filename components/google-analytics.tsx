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

/**
 * GA4 "Page path" strips query strings, so /?q=foo all collapse to "/".
 * Map search UI URLs to virtual paths that show as distinct rows in Realtime.
 */
function analyticsPagePath(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const q = (searchParams.get("q") || "").trim()
  const pageRaw = Number(searchParams.get("page") || "1")
  const page =
    Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1

  if ((pathname === "/" || pathname === "") && q) {
    const base = `/search/${encodeURIComponent(q)}`
    return page > 1 ? `${base}/p/${page}` : base
  }

  const qs = searchParams.toString()
  return qs ? `${pathname}?${qs}` : pathname || "/"
}

function analyticsTitle(pathname: string, searchParams: URLSearchParams): string {
  const q = (searchParams.get("q") || "").trim()
  if ((pathname === "/" || pathname === "") && q) {
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

  const pagePath = analyticsPagePath(pathname, searchParams)
  const pageTitle = analyticsTitle(pathname, searchParams)
  const q = (searchParams.get("q") || "").trim()

  // Preferred SPA pattern for GA4 — updates the current page and sends page_view.
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  })

  if (q) {
    window.gtag("event", "search", {
      search_term: q,
      page_path: pagePath,
    })
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
      // gtag.js may not be ready on first paint.
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
 * Search navigations become /search/<query> page paths so Realtime is usable.
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
