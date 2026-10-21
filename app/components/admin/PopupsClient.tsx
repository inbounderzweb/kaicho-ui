"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePopupFilters } from "@/lib/hooks/admin/usePopupFilters";
import { usePopupList, useDeletePopup, useSetPopupStatus } from "@/lib/hooks/admin/usePopups";
import { ApiError } from "@/lib/api/ApiError";
import type { Popup } from "@/lib/api/popup";
import PopupStatusBadge from "./PopupStatusBadge";
import AdminPagination from "./AdminPagination";
import ConfirmDialog from "./ConfirmDialog";
import { IconSearch } from "../ui/icons";

function timingSummary(p: Popup): string {
  const t = p.timing.useSharedTimingSettings ? p.timing.shared : null;
  if (!t) {
    return `Desktop ${p.timing.desktop.initialDelaySeconds}s · Mobile ${p.timing.mobile.initialDelaySeconds}s delay`;
  }
  return `${t.initialDelaySeconds}s delay · ${t.autoCloseEnabled ? `closes after ${t.autoCloseAfterSeconds}s` : "no auto-close"}`;
}

function PauseResume({ popup, onError }: { popup: Popup; onError: (m: string) => void }) {
  const mutation = useSetPopupStatus(popup.id);
  if (popup.status !== "PUBLISHED" && popup.status !== "PAUSED") return null;
  const next = popup.status === "PUBLISHED" ? "PAUSED" : "PUBLISHED";
  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate(next, {
          onError: (e) => onError(e instanceof ApiError ? e.message : "Something went wrong."),
        })
      }
      className="text-xs font-semibold text-black/55 hover:underline disabled:opacity-50 dark:text-white/55"
    >
      {next === "PAUSED" ? "Pause" : "Resume"}
    </button>
  );
}

export default function PopupsClient() {
  const filters = usePopupFilters();
  const { data, isLoading, isError, refetch, isPlaceholderData } = usePopupList(filters);
  const deleteMutation = useDeletePopup();

  const [searchInput, setSearchInput] = useState(filters.search);
  useEffect(() => {
    const id = setTimeout(() => setSearchInput(filters.search), 0);
    return () => clearTimeout(id);
  }, [filters.search]);
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== filters.search) filters.update({ search: searchInput || undefined });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [archiveTarget, setArchiveTarget] = useState<Popup | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasActiveFilters = Boolean(filters.search || filters.status !== "all");
  const clearFilters = () => {
    setSearchInput("");
    filters.update({ search: undefined, status: undefined });
  };

  const confirmArchive = () => {
    if (!archiveTarget) return;
    setActionError(null);
    deleteMutation.mutate(archiveTarget.id, {
      onSuccess: () => setArchiveTarget(null),
      onError: (err) => setActionError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Popups</h1>
          <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
            Marketing popups shown on the Kaicho storefront — timing, dismissal and schedule.
          </p>
        </div>
        <Link
          href="/admin/popups/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          + New Popup
        </Link>
      </div>

      {actionError && (
        <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{actionError}</p>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name..."
            aria-label="Search popups"
            className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
        </div>
        <select
          value={filters.status}
          aria-label="Filter by status"
          onChange={(e) => filters.update({ status: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">All (except archived)</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="PAUSED">Paused</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary">
            Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm font-semibold">Unable to load popups.</p>
            <button type="button" onClick={() => refetch()} className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90">
              Retry
            </button>
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold">No popups found.</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              {hasActiveFilters ? "Try changing your search or filters." : "Create your first popup to get started."}
            </p>
            {!hasActiveFilters && (
              <Link href="/admin/popups/new" className="mt-4 inline-flex rounded-full bg-admin-primary px-4 py-2 text-xs font-semibold text-black hover:opacity-90">
                New Popup
              </Link>
            )}
          </div>
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="divide-y divide-admin-border dark:divide-admin-border-dark">
              {data.items.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/popups/${p.id}`} className="font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <PopupStatusBadge state={p.effectiveState} />
                    </div>
                    <p className="truncate text-xs text-black/50 dark:text-white/50">
                      {p.content.heading || p.content.body || "No content"}
                    </p>
                    <p className="text-xs text-black/50 dark:text-white/50">
                      {timingSummary(p)} · Priority {p.priority} ·{" "}
                      {[p.devices.desktop.enabled && "Desktop", p.devices.mobile.enabled && "Mobile"].filter(Boolean).join(" + ") || "No device"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <Link href={`/admin/popups/${p.id}`} className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary">
                      Edit
                    </Link>
                    <PauseResume popup={p} onError={setActionError} />
                    {p.status !== "ARCHIVED" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setArchiveTarget(p);
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {data && !isLoading && !isError && (
          <AdminPagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={data.total}
            itemLabel="popups"
            onPageChange={(p) => filters.update({ page: p }, false)}
            onPageSizeChange={(size) => filters.update({ pageSize: size })}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive this popup?"
        description={`"${archiveTarget?.name}" will stop showing on the storefront immediately. You can find it again under the Archived filter.`}
        confirmLabel="Archive"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
