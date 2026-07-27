"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function buildPages(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current]);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  for (const n of sorted) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && n - prev > 1) out.push("gap");
    out.push(n);
  }
  return out;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPages(page, totalPages);

  return (
    <nav
      className="pagination mt-8 flex justify-center border-t border-border pt-6"
      aria-label="გვერდები"
    >
      <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
        {items.map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              className="flex h-10 w-6 items-center justify-center text-muted-foreground"
              aria-hidden
            >
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`გვერდი ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={
                  item === page
                    ? "pagination-page is-active inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums text-white"
                    : "pagination-page inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-medium tabular-nums text-foreground transition-colors hover:bg-[#f3f5f8] active:bg-[#e9edf3]"
                }
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
