import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { slugifyQuery } from "@/lib/search/seo-slugs"

/**
 * Consolidate legacy /?q=… SPA URLs onto indexable /search/{slug} landings.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  if (pathname !== "/") return NextResponse.next()

  const q = (searchParams.get("q") || "").trim()
  if (!q) return NextResponse.next()

  const slug = slugifyQuery(q)
  const url = request.nextUrl.clone()
  url.pathname = `/search/${encodeURIComponent(slug)}`
  url.search = ""
  url.searchParams.set("q", q)
  const page = searchParams.get("page")
  if (page && page !== "1") url.searchParams.set("page", page)

  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: ["/"],
}
