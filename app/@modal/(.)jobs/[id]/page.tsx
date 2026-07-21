import { notFound } from "next/navigation"
import { JobDetail } from "@/components/job-detail"
import { loadJob } from "@/lib/load-job"

type InterceptedJobPageProps = {
  params: Promise<{ id: string }>
}

/**
 * Soft-nav intercept from list routes: keeps the list mounted underneath so
 * nested scroll (and loaded pages) survive open → back.
 */
export default async function InterceptedJobPage({
  params,
}: InterceptedJobPageProps) {
  const { id } = await params
  const decoded = decodeURIComponent(id)
  const job = await loadJob(decoded)

  if (!job) notFound()

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <JobDetail job={job} />
    </div>
  )
}
