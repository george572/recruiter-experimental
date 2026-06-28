"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Eye, EyeOff, Phone } from "lucide-react"
import Link from "next/link"

const inputClassName =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/20"

type AuthMode = "login" | "register"

export function DashboardLogin() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [phone, setPhone] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === "login") {
      router.push("/dashboard/app")
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setShowPassword(false)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-[25px] py-10 lg:px-[60px]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[480px] translate-x-1/4 translate-y-1/4 rounded-full bg-primary/[0.03] blur-3xl" />
      </div>

      <Link
        href="/"
        className="absolute left-[25px] top-5 flex h-8 items-center justify-center rounded-md bg-primary px-3 transition-opacity hover:opacity-90 lg:left-[60px] lg:top-5"
      >
        <span className="text-sm font-bold text-primary-foreground">Recruiter.ge</span>
      </Link>

      <div className="w-full">
        <p className="mx-auto mb-8 max-w-[800px] text-center font-[family-name:var(--font-dachi)] text-[48px] leading-snug tracking-tight text-foreground">
          გამოსცადე ხელოვნური ინტელექტის ჯადოქრობა
        </p>

        <div className="mx-auto max-w-[600px] rounded-3xl border border-border/60 bg-card p-8 shadow-[0_12px_40px_-16px_rgba(20,24,40,0.14)] sm:p-10">
          <div className="mb-6 grid grid-cols-2 rounded-full bg-secondary p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`cursor-pointer rounded-full px-3 py-2 text-center text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              შესვლა
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`cursor-pointer rounded-full px-3 py-2 text-center text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              რეგისტრაცია
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="dashboard-phone" className="text-sm font-medium text-foreground">
                ტელეფონის ნომერი
              </label>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="dashboard-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="5XX XX XX XX"
                  className={`${inputClassName} pl-11`}
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="dashboard-company-id" className="text-sm font-medium text-foreground">
                  კომპანიის იდენტიფიკატორი
                </label>
                <div className="relative">
                  <Building2
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="dashboard-company-id"
                    type="text"
                    autoComplete="organization"
                    value={companyId}
                    onChange={(event) => setCompanyId(event.target.value)}
                    placeholder="მაგ. 405123456"
                    className={`${inputClassName} pl-11`}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="dashboard-password" className="text-sm font-medium text-foreground">
                პაროლი
              </label>
              <div className="relative">
                <input
                  id="dashboard-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className={`${inputClassName} pr-11`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "პაროლის დამალვა" : "პაროლის ჩვენება"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {mode === "login" ? "შესვლა" : "რეგისტრაცია"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
