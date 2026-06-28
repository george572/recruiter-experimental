import { Search } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="z-50 mx-auto w-full max-w-[1800px] shrink-0 px-[60px] pt-5">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4 md:px-8 md:py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <span className="text-sm font-bold text-primary-foreground">R</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {["Jobs", "Companies", "Salaries", "About"].map((item) => (
            <a
              key={item}
              href="#"
              className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            aria-label="ძიება"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
          <a
            href="#"
            className="hidden cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            შესვლა
          </a>
          <a
            href="#"
            className="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            ვაკანსიის დამატება
          </a>
        </div>
      </div>
    </header>
  )
}
