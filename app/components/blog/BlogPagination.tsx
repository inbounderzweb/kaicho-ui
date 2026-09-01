import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "../ui/icons";

// SEO-friendly pagination: real <a href> links crawlers can follow, not
// client-side state. Each page's own canonical points at itself (see the
// blog list pages), so there are no duplicate-canonical conflicts.
export default function BlogPagination({
  page,
  totalPages,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (n: number) => string;
}) {
  if (totalPages <= 1) return null;

  // Compact window around the current page.
  const pages: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(totalPages, page + 2);
  for (let i = from; i <= to; i++) pages.push(i);

  const linkBase =
    "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors";

  return (
    <nav aria-label="Blog pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)} rel="prev" aria-label="Previous page" className={`${linkBase} border border-border text-ink-muted hover:border-brand hover:text-brand`}>
          <IconChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={`${linkBase} border border-border text-ink-faint opacity-40`} aria-hidden>
          <IconChevronLeft className="h-4 w-4" />
        </span>
      )}

      {from > 1 && (
        <>
          <Link href={hrefForPage(1)} className={`${linkBase} text-ink-muted hover:bg-cream hover:text-ink`}>1</Link>
          {from > 2 && <span className="px-1 text-ink-faint">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefForPage(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${linkBase} ${p === page ? "bg-brand text-white" : "text-ink-muted hover:bg-cream hover:text-ink"}`}
        >
          {p}
        </Link>
      ))}

      {to < totalPages && (
        <>
          {to < totalPages - 1 && <span className="px-1 text-ink-faint">…</span>}
          <Link href={hrefForPage(totalPages)} className={`${linkBase} text-ink-muted hover:bg-cream hover:text-ink`}>
            {totalPages}
          </Link>
        </>
      )}

      {page < totalPages ? (
        <Link href={hrefForPage(page + 1)} rel="next" aria-label="Next page" className={`${linkBase} border border-border text-ink-muted hover:border-brand hover:text-brand`}>
          <IconChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={`${linkBase} border border-border text-ink-faint opacity-40`} aria-hidden>
          <IconChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
