"use client"

import { Suspense, useEffect } from "react"
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

/** Send a GA4 page_view for the current URL (includes ?q=&page=). */
function sendPageView(pathname: string, search: string) {
  if (typeof window.gtag !== "function") return
  const path = `${pathname}${search}`
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

function GaRouteListener() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const searchSuffix = search ? `?${search}` : ""

  useEffect(() => {
    sendPageView(pathname, searchSuffix)
  }, [pathname, searchSuffix])

  return null
}

/**
 * Google Analytics 4 (gtag.js).
 * Loads in production only. SPA URL changes (?q=, &page=) each get a page_view
 * so Realtime / Path reports show searches — not only "/".
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
