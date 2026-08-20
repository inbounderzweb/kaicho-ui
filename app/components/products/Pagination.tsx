"use client";

import { IconChevronLeft, IconChevronRight } from "../ui/icons";

// Simple, keyboard/screen-reader-friendly prev/next + page-number
// pagination for server-paginated lists (spec: pageSize 24, server-side —
// never fetch every page and paginate client-side).
export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const pages = visiblePages(page, pageCount);

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-border disabled:hover:text-ink-muted"
      >
        <IconChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-ink-faint">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              p === page ? "bg-brand text-white" : "text-ink-muted hover:bg-cream"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-border disabled:hover:text-ink-muted"
      >
        <IconChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

function visiblePages(current: number, count: number): (number | "…")[] {
  const delta = 1;
  const range: (number | "…")[] = [];
  let last = 0;

  for (let i = 1; i <= count; i++) {
    if (i === 1 || i === count || (i >= current - delta && i <= current + delta)) {
      if (last && i - last > 1) range.push("…");
      range.push(i);
      last = i;
    }
  }

  return range;
}
