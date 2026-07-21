import JobLoading from "@/app/jobs/[id]/loading"

export default function InterceptedJobLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <JobLoading />
    </div>
  )
}
