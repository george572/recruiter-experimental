"use client"

const CV_STATS = [
  { label: "გაგზავნილი", value: 24, percent: 100, note: "ამ თვეში", color: "bg-foreground" },
  { label: "ნახეს", value: 18, percent: 75, note: "75%", color: "bg-slate-500" },
  { label: "გადმოწერილი", value: 7, percent: 29, note: "", color: "bg-sky-500" },
] as const

const INVITATION_STATS = [
  { label: "ინტერვიუს მოწვევები", value: "2" },
  { label: "პროფილის შენახვები", value: "6" },
] as const

const PROFILE_VIEWS = [
  { label: "პროფილის ნახვები", value: "142", note: "ბოლო 30 დღე" },
  { label: "უნიკალური რეკრუტერები", value: "38", note: "ბოლო 30 დღე" },
  { label: "პროფილის გამოჩენა ძებნაში", value: "56", note: "ბოლო 30 დღე" },
] as const

export function StatisticsPanel() {
  return (
    <div className="flex flex-col gap-5">
      <section className="space-y-4 rounded-3xl bg-secondary/70 p-7 text-foreground">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-600">მოწვევები</p>
            <p className="mt-2 text-4xl font-semibold leading-none text-emerald-600">3</p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            ნახვა
          </button>
        </div>

        <div className="space-y-2 pt-2">
          {INVITATION_STATS.map((item) => (
            <ActivityLine key={item.label} label={item.label} value={item.value} accent />
          ))}
          <ActivityLine label="საშ. პასუხი" value="1 დღე" accent />
        </div>
      </section>

      <section className="space-y-5 rounded-3xl bg-secondary/70 p-7">
        <SectionTitle eyebrow="CV სტატისტიკა" value="ბოლო 30 დღე" />
        <div className="space-y-4">
          {CV_STATS.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-secondary/70 p-7">
        <SectionTitle eyebrow="პროფილის აქტივობა" value="ბოლო 30 დღე" />
        <div className="space-y-3">
          {PROFILE_VIEWS.map((item) => (
            <div key={item.label} className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{item.note}</p>
              </div>
              <p className="text-2xl font-semibold leading-none text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SectionTitle({ eyebrow, value }: { eyebrow: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Stat({
  label,
  value,
  percent,
  note,
  color,
}: {
  label: string
  value: number
  percent: number
  note: string
  color: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{note}</p>
        </div>
        <p className="text-2xl font-semibold leading-none text-foreground">{value}</p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function ActivityLine({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "font-medium tabular-nums text-emerald-600" : "font-medium tabular-nums text-foreground"}>
        {value}
      </span>
    </div>
  )
}
