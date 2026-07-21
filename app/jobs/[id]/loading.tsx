export default function JobLoading() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-3.5 sm:px-6 lg:px-10">
        <div className="h-5 w-28 animate-pulse rounded bg-secondary" />
        <div className="size-9 animate-pulse rounded-full bg-secondary" />
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto w-full max-w-5xl px-5 pt-4 sm:px-6 lg:px-10 lg:pt-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
            <div className="space-y-4">
              <div className="animate-pulse rounded-3xl border border-border/60 bg-card p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="size-14 shrink-0 rounded-2xl bg-secondary" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-6 w-3/4 rounded bg-secondary" />
                    <div className="h-4 w-1/3 rounded bg-secondary" />
                    <div className="flex gap-2 pt-1">
                      <div className="h-7 w-20 rounded-full bg-secondary" />
                      <div className="h-7 w-24 rounded-full bg-secondary" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-48 animate-pulse rounded-3xl border border-border/60 bg-card" />
            </div>
            <div className="hidden space-y-4 lg:block">
              <div className="h-64 animate-pulse rounded-3xl border border-border/60 bg-card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
