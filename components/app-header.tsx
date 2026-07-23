import { LogIn, Menu } from "lucide-react"
import Link from "next/link"
import { FeedbackTrigger } from "@/components/feedback-prompt"

export function AppHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 pb-5">
      <Link
        href="/"
        className="inline-flex items-center transition-opacity hover:opacity-70"
      >
        <span className="font-sans text-lg font-semibold text-black">Recruiter.ge</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <FeedbackTrigger className="border-0 bg-transparent hover:bg-secondary" />
        <button
          type="button"
          aria-label="მენიუ"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Link
          href="/dashboard"
          aria-label="შესვლა"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LogIn className="h-4 w-4" />
        </Link>
        <a
          href="#"
          className="hidden cursor-pointer rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 lg:inline-flex lg:items-center"
        >
          ვაკანსიის დამატება
        </a>
      </div>
    </header>
  )
}
