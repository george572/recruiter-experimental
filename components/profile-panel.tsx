"use client"

import { Pencil, Rocket } from "lucide-react"
import { ProfileControls } from "@/components/profile-controls"

export function ProfilePanel() {
  return (
    <aside className="flex min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <section className="space-y-4 rounded-3xl bg-secondary/70 p-7">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold leading-none text-foreground">გიორგი</h2>
              <button
                type="button"
                aria-label="პროფილის სახელის რედაქტირება"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">ფრონტენდ ინჟინერი · თბილისი</p>
          </div>
          <p className="max-w-[18rem] text-sm leading-6 text-foreground">
            React, TypeScript და პროდუქტის ინტერფეისები. ღიაა უფროსი ფრონტენდ და დიზაინ-სისტემების როლებისთვის.
          </p>
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">პროფილის სისრულე 95%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[82%] rounded-full bg-foreground" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-secondary/70 p-7">
          <ProfileControls />
        </section>

        <section className="mt-auto rounded-3xl bg-secondary/70 p-7">
          <button
            type="button"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Rocket className="h-4 w-4" />
            პროფილის დაბუსტვა
          </button>
        </section>
      </div>
    </aside>
  )
}
