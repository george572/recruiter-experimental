import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { JobSearch } from "@/components/search/job-search"
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo"
import {
  getHomeKeywordLinks,
  searchPath,
} from "@/lib/search/seo-keywords"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
  },
}

export default function Page() {
  const keywordLinks = getHomeKeywordLinks(20)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWebsiteJsonLd()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildOrganizationJsonLd()),
        }}
      />
      <Suspense fallback={null}>
        <JobSearch />
      </Suspense>

      {/* Crawlable internal links for competitive keywords (SSR). */}
      <footer className="mt-auto border-t border-border bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="text-sm font-semibold text-foreground">
            პოპულარული ვაკანსიები
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ინდექსირებადი გვერდები {SITE_NAME}-ზე — კატეგორიები და როლები.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-sm">
            {keywordLinks.map((k) => (
              <li key={k.slug}>
                <Link
                  href={searchPath(k.query)}
                  className="text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
                >
                  {k.query}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/vakansiebi"
                className="text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
              >
                ყველა კატეგორია
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
