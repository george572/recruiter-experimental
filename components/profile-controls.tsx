"use client"

import { useState } from "react"

const PROFILE_STATUSES = [
  { id: "open", label: "ღია შეთავაზებებისთვის", detail: "პროფილი ჩანს მშვიდ რეჟიმში" },
  { id: "active", label: "აქტიურად ვეძებ", detail: "რეკრუტერების მიწვდომა პრიორიტეტულია" },
  { id: "hired", label: "დასაქმებული", detail: "ახალი შეთავაზებები შეჩერებულია" },
] as const

type ProfileStatus = (typeof PROFILE_STATUSES)[number]["id"]

export function ProfileControls() {
  const [status, setStatus] = useState<ProfileStatus>("active")
  const [visibility, setVisibility] = useState<"public" | "private">("public")

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <SectionTitle
          eyebrow="პროფილის ხილვადობა"
          value={visibility === "public" ? "ჩანს" : "დამალულია"}
        />
        <div className="grid grid-cols-2 rounded-full bg-secondary p-1">
          <SegmentButton
            label="საჯარო"
            active={visibility === "public"}
            onClick={() => setVisibility("public")}
          />
          <SegmentButton
            label="პირადი"
            active={visibility === "private"}
            onClick={() => setVisibility("private")}
          />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          საჯაროს ხედავს ყველა რეკრუტერი, დახურულს ხედავ მხოლოდ შენ
        </p>
      </section>

      <section className="space-y-4">
        <SectionTitle
          eyebrow="პროფილის სტატუსი"
          value={PROFILE_STATUSES.find((item) => item.id === status)?.label ?? ""}
        />
        <div className="space-y-2">
          {PROFILE_STATUSES.map((item) => (
            <StatusOption
              key={item.id}
              label={item.label}
              detail={item.detail}
              active={status === item.id}
              onClick={() => setStatus(item.id)}
            />
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

function SegmentButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-3 py-1.5 text-center text-xs font-medium transition-colors ${
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  )
}

function StatusOption({
  label,
  detail,
  active,
  onClick,
}: {
  label: string
  detail: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full cursor-pointer rounded-2xl px-3 py-2 text-left transition-colors ${
        active ? "bg-secondary" : "hover:bg-secondary/60"
      }`}
    >
      <span
        className={`block text-sm transition-colors ${
          active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span className="mr-2">{active ? "•" : "○"}</span>
        {label}
      </span>
      <span className="mt-1 block pl-5 text-xs leading-5 text-muted-foreground">{detail}</span>
    </button>
  )
}
