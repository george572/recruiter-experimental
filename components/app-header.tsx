import { LogIn, Menu } from "lucide-react"
import Link from "next/link"

export function AppHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 pb-5">
      <Link
        href="/"
        className="flex h-8 items-center justify-center rounded-md bg-primary px-3 transition-opacity hover:opacity-90"
      >
        <span className="text-sm font-bold text-primary-foreground">Recruiter.ge</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
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
