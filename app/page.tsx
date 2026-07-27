import { Suspense } from "react"
import type { Metadata } from "next"
import { JobSearch } from "@/components/search/job-search"
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@/lib/seo"

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
  return (
    <>
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
    </>
  )
}
