"use client";

import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/api/client";
import { useMediaList } from "@/lib/hooks/admin/useMediaList";
import type { AdminMedia, MediaQueryParams } from "@/lib/api/media";
import AdminPagination from "../AdminPagination";
import { IconSearch, IconFileText, IconCheck } from "../../ui/icons";

// The shared media grid — toolbar (search / type / dimensions / sort),
// results grid, pagination. Fully controlled: the parent owns the filter
// state (URL-backed on the /admin/media page, local useState inside the
// picker modal) and the selection. This is the ONE implementation behind
// both the standalone library page and "Choose from Library".

export type MediaBrowserFilters = Required<
  Pick<MediaQueryParams, "page" | "pageSize" | "sort" | "order">
> & {
  search: string;
  mediaType: "all" | "IMAGE" | "DOCUMENT";
  status: "all" | "TEMPORARY" | "ATTACHED";
  minWidth?: number;
  minHeight?: number;
};

export const DEFAULT_MEDIA_FILTERS: MediaBrowserFilters = {
  page: 1,
  pageSize: 24,
  search: "",
  mediaType: "all",
  status: "all",
  sort: "createdAt",
  order: "desc",
};

const SORT_OPTIONS: { label: string; sort: MediaBrowserFilters["sort"]; order: "asc" | "desc" }[] = [
  { label: "Newest", sort: "createdAt", order: "desc" },
  { label: "Oldest", sort: "createdAt", order: "asc" },
  { label: "Name A–Z", sort: "originalName", order: "asc" },
  { label: "Name Z–A", sort: "originalName", order: "desc" },
  { label: "Largest", sort: "size", order: "desc" },
];

const DIMENSION_PRESETS: { label: string; minWidth?: number; minHeight?: number }[] = [
  { label: "Any size" },
  { label: "≥ 500px wide", minWidth: 500 },
  { label: "≥ 800px wide", minWidth: 800 },
  { label: "≥ 1000px wide", minWidth: 1000 },
  { label: "≥ 1600px wide", minWidth: 1600 },
];

export default function MediaBrowser({
  filters,
  onFilters,
  selectable = "none",
  selectedIds = [],
  onToggleSelect,
  onOpenItem,
  restrictKind,
}: {
  filters: MediaBrowserFilters;
  onFilters: (patch: Partial<MediaBrowserFilters>, resetPage?: boolean) => void;
  selectable?: "none" | "single" | "multiple";
  selectedIds?: string[];
  onToggleSelect?: (item: AdminMedia) => void;
  /** Opens the detail view. In "none" mode this is the tile's whole job. */
  onOpenItem?: (item: AdminMedia) => void;
  /** Force the type filter (the picker only ever wants images). */
  restrictKind?: "IMAGE" | "DOCUMENT";
}) {
  const query: MediaQueryParams = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    mediaType: restrictKind ?? (filters.mediaType === "all" ? undefined : filters.mediaType),
    status: filters.status === "all" ? undefined : filters.status,
    minWidth: filters.minWidth,
    minHeight: filters.minHeight,
    sort: filters.sort,
    order: filters.order,
  };
  const { data, isLoading, isError, refetch, isPlaceholderData } = useMediaList(query);

  // Debounced search box (mirrors the old MediaLibraryClient behaviour).
  const [searchInput, setSearchInput] = useState(filters.search);
  useEffect(() => {
    const id = setTimeout(() => setSearchInput(filters.search), 0);
    return () => clearTimeout(id);
  }, [filters.search]);
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== filters.search) onFilters({ search: searchInput || undefined });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const selected = new Set(selectedIds);
  const hasActiveFilters =
    Boolean(filters.search) ||
    (!restrictKind && filters.mediaType !== "all") ||
    filters.status !== "all" ||
    Boolean(filters.minWidth) ||
    Boolean(filters.minHeight);

  const clearFilters = () => {
    setSearchInput("");
    onFilters({
      search: undefined,
      mediaType: "all",
      status: "all",
      minWidth: undefined,
      minHeight: undefined,
    });
  };

  const handleTileClick = (item: AdminMedia) => {
    if (selectable === "none") {
      onOpenItem?.(item);
      return;
    }
    onToggleSelect?.(item);
  };

  const sortValue = SORT_OPTIONS.findIndex(
    (o) => o.sort === filters.sort && o.order === filters.order
  );
  const dimValue = DIMENSION_PRESETS.findIndex((p) => (p.minWidth ?? undefined) === filters.minWidth);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[180px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by filename or alt text..."
            className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
        </div>

        {!restrictKind && (
          <select
            value={filters.mediaType}
            onChange={(e) => onFilters({ mediaType: e.target.value as MediaBrowserFilters["mediaType"] })}
            className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
          >
            <option value="all">All types</option>
            <option value="IMAGE">Images</option>
            <option value="DOCUMENT">PDFs</option>
          </select>
        )}

        <select
          value={dimValue < 0 ? 0 : dimValue}
          onChange={(e) => {
            const preset = DIMENSION_PRESETS[Number(e.target.value)];
            onFilters({ minWidth: preset.minWidth, minHeight: preset.minHeight });
          }}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          {DIMENSION_PRESETS.map((p, i) => (
            <option key={p.label} value={i}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          value={sortValue < 0 ? 0 : sortValue}
          onChange={(e) => {
            const opt = SORT_OPTIONS[Number(e.target.value)];
            onFilters({ sort: opt.sort, order: opt.order });
          }}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          {SORT_OPTIONS.map((o, i) => (
            <option key={o.label} value={i}>
              {o.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm font-semibold">Couldn&apos;t load media.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold">No media found</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              Upload a file or try changing your filters.
            </p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${
              isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"
            }`}
          >
            {data.items.map((item) => {
              const isSelected = selected.has(item.mediaId);
              return (
                <button
                  key={item.mediaId}
                  type="button"
                  onClick={() => handleTileClick(item)}
                  aria-pressed={selectable !== "none" ? isSelected : undefined}
                  className={`group relative flex aspect-square flex-col overflow-hidden rounded-xl border text-left transition-shadow ${
                    isSelected
                      ? "border-admin-primary-dark ring-2 ring-admin-primary-dark dark:border-admin-primary dark:ring-admin-primary"
                      : "border-admin-border dark:border-admin-border-dark"
                  }`}
                >
                  {item.mediaType === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(item.thumbnailUrl!)}
                      alt={item.altText ?? item.originalName}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-admin-surface p-3 dark:bg-admin-surface-dark">
                      <IconFileText className="h-8 w-8 text-black/40 dark:text-white/40" />
                      <p className="line-clamp-2 text-center text-[11px] font-semibold">{item.originalName}</p>
                      {item.pageCount !== undefined && (
                        <p className="text-[10px] text-black/45 dark:text-white/45">{item.pageCount} pages</p>
                      )}
                    </div>
                  )}

                  {isSelected && (
                    <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-admin-primary-dark text-white dark:bg-admin-primary dark:text-black">
                      <IconCheck className="h-3.5 w-3.5" />
                    </span>
                  )}

                  {selectable === "none" && (
                    <span
                      className={`absolute m-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        item.status === "TEMPORARY" ? "bg-amber-500/90 text-white" : "bg-emerald-500/90 text-white"
                      }`}
                    >
                      {item.usageCount > 0 ? `${item.usageCount} use${item.usageCount === 1 ? "" : "s"}` : item.status}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {data && !isLoading && !isError && (
          <AdminPagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={data.total}
            itemLabel="files"
            onPageChange={(p) => onFilters({ page: p }, false)}
            onPageSizeChange={(size) => onFilters({ pageSize: size })}
          />
        )}
      </div>
    </div>
  );
}
