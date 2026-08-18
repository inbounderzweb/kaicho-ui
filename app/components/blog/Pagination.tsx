import { IconChevronLeft, IconChevronRight } from "../ui/icons";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Blog pagination"
      className="mt-10 flex items-center justify-center gap-1.5 sm:gap-2"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-10"
      >
        <IconChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          aria-label={`Page ${p}`}
          aria-current={p === page ? "page" : undefined}
          onClick={() => onPageChange(p)}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors sm:h-10 sm:w-10 ${
            p === page
              ? "bg-brand text-white"
              : "text-ink-muted hover:bg-cream hover:text-ink"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        aria-label="Next page"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-10"
      >
        <IconChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
