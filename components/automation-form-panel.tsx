"use client"

import { useState } from "react"

const CV_OPTIONS = [
  { id: "existing", label:"გამოიყენე ჩემი CV", description: "შენი ამჟამინდელი CV იქნება გამოყენებული" },
  { id: "unique", label:"შეიქმნას უნიკალური CV", description: "უნიკალური CV შეიქმნება ყველა ინდივიდუალური ვაკანსიისთვის" },
] as const

type CvOption = (typeof CV_OPTIONS)[number]["id"]

export function AutomationFormPanel() {
  const [criteria, setCriteria] = useState("")
  const [cvOption, setCvOption] = useState<CvOption>("existing")
  const [preferredCompanies, setPreferredCompanies] = useState("")
  const [undesiredCompanies, setUndesiredCompanies] = useState("")

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="automation-criteria" className="text-sm font-medium text-foreground">
          აღწერე შენთვის მისაღები პირობები, ხელფასი და სხვა ნებისმიერი დეტალი. "რეკრუტერი" ამ ინფორმაციაზე დაყრდნობით HR-ს მოელაპარაკება შენს მაგივრად.
        </label>
        <textarea
          id="automation-criteria"
          value={criteria}
          onChange={(event) => setCriteria(event.target.value)}
          rows={4}
          placeholder="ვეძებ კონსულტანტის ვაკანსიებს, მნიშვნელოვანია იყოს ხელშეწყობა სტუდენტებისთვის, და ხელფასი იყოს მინიმუმ 1200 ლარი "
          className="mt-4 w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">CV ლოგიკა</p>
          <p className="text-sm font-medium text-muted-foreground">
            {CV_OPTIONS.find((option) => option.id === cvOption)?.description}
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-full bg-secondary p-1">
          {CV_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setCvOption(option.id)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-center text-xs font-medium transition-colors ${
                cvOption === option.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="preferred-companies" className="text-sm font-medium text-foreground">
          სასურველი კომპანიები
        </label>
        <textarea
          id="preferred-companies"
          value={preferredCompanies}
          onChange={(event) => setPreferredCompanies(event.target.value)}
          rows={3}
          placeholder="კომპანიის სახელები გამოყავი მძიმით"
          className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="undesired-companies" className="text-sm font-medium text-foreground">
          არასასურველი კომპანიები
        </label>
        <textarea
          id="undesired-companies"
          value={undesiredCompanies}
          onChange={(event) => setUndesiredCompanies(event.target.value)}
          rows={3}
          placeholder="კომპანიის სახელები გამოყავი მძიმით. არ ინერვიულო, სადაც ახლა მუშაობ ეგ კომპანია ავტომატურად ზის ამ სიაში"
          className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
