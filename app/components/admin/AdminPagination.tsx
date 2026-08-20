const PAGE_SIZE_OPTIONS = [20, 50, 100];

export default function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemLabel = "results",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemLabel?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-admin-border px-4 py-3 text-sm dark:border-admin-border-dark sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-center gap-4">
        <p className="text-black/55 dark:text-white/55">
          {total === 0
            ? `No ${itemLabel}`
            : `Showing ${from.toLocaleString("en-IN")}–${to.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} ${itemLabel}`}
        </p>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-black/55 dark:text-white/55">
            Rows
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-admin-border bg-admin-card px-1.5 py-1 text-black dark:border-admin-border-dark dark:bg-admin-card-dark dark:text-white"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-full border border-admin-border px-3 py-1 font-semibold disabled:opacity-40 dark:border-admin-border-dark"
        >
          Prev
        </button>
        <span className="tabular-nums text-black/55 dark:text-white/55">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-full border border-admin-border px-3 py-1 font-semibold disabled:opacity-40 dark:border-admin-border-dark"
        >
          Next
        </button>
      </div>
    </div>
  );
}
