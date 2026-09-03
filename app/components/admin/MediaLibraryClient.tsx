"use client";

import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/lib/api/client";
import { useMediaFilters } from "@/lib/hooks/admin/useMediaFilters";
import { useUpdateMedia } from "@/lib/hooks/admin/useUpdateMedia";
import { useDeleteMedia } from "@/lib/hooks/admin/useDeleteMedia";
import { fetchMediaUsages, type AdminMedia, type MediaUsageInfo } from "@/lib/api/media";
import { ApiError } from "@/lib/api/ApiError";
import ConfirmDialog from "./ConfirmDialog";
import MediaBrowser, { type MediaBrowserFilters } from "./media/MediaBrowser";
import MediaUploadPanel from "./media/MediaUploadPanel";
import { IconFileText, IconClose, IconTrash } from "../ui/icons";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MediaLibraryClient() {
  const filters = useMediaFilters();
  const deleteMutation = useDeleteMedia();

  const browserFilters: MediaBrowserFilters = {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search,
    mediaType: filters.mediaType === "all" ? "all" : (filters.mediaType as "IMAGE" | "DOCUMENT"),
    status: filters.status === "all" ? "all" : (filters.status as "TEMPORARY" | "ATTACHED"),
    minWidth: filters.minWidth,
    minHeight: filters.minHeight,
    sort: filters.sort,
    order: filters.order,
  };

  const [selected, setSelected] = useState<AdminMedia | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminMedia | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Media Library</h1>
        <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
          Upload and manage images and PDFs. Any image here can be reused from any image field across the admin.
        </p>
      </div>

      <MediaUploadPanel onUploaded={() => { /* the grid refetches via query invalidation */ }} />

      <MediaBrowser
        filters={browserFilters}
        onFilters={(patch, resetPage = true) => filters.update(patch, resetPage)}
        selectable="none"
        onOpenItem={(item) => {
          setDeleteError(null);
          setSelected(item);
        }}
      />

      {selected && (
        <MediaDetailModal
          media={selected}
          onClose={() => setSelected(null)}
          onDelete={() => {
            setDeleteTarget(selected);
            setSelected(null);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this file?"
        description={
          deleteError ??
          `"${deleteTarget?.originalName}" and its stored file(s) will be permanently removed. This cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          setDeleteError(null);
          deleteMutation.mutate(deleteTarget.mediaId, {
            onSuccess: () => setDeleteTarget(null),
            onError: (err) => {
              const details = err instanceof ApiError ? (err.details as { usageCount?: number }) : undefined;
              setDeleteError(
                details?.usageCount
                  ? `This image is used in ${details.usageCount} place${details.usageCount === 1 ? "" : "s"} and can't be deleted until those references are removed.`
                  : err instanceof Error
                    ? err.message
                    : "Couldn't delete. Please try again."
              );
            },
          });
        }}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}

function MediaDetailModal({
  media,
  onClose,
  onDelete,
}: {
  media: AdminMedia;
  onClose: () => void;
  onDelete: () => void;
}) {
  const updateMutation = useUpdateMedia(media.mediaId);
  const [altText, setAltText] = useState(media.altText ?? "");
  const [usages, setUsages] = useState<MediaUsageInfo[] | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let live = true;
    fetchMediaUsages(media.mediaId)
      .then((res) => live && setUsages(res.usages))
      .catch(() => live && setUsages([]));
    return () => {
      live = false;
    };
  }, [media.mediaId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-admin-border bg-admin-card p-5 shadow-xl dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <IconClose className="h-4 w-4" />
        </button>

        <div className="flex w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-admin-surface dark:bg-admin-surface-dark sm:w-56">
          {media.mediaType === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(media.mediumUrl ?? media.url)}
              alt={media.altText ?? media.originalName}
              className="max-h-72 w-full object-contain"
            />
          ) : (
            <a
              href={resolveMediaUrl(media.url)}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-2 p-8 text-center"
            >
              <IconFileText className="h-10 w-10 text-black/40 dark:text-white/40" />
              <span className="text-xs font-semibold underline">Open PDF</span>
            </a>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="truncate text-sm font-bold">{media.originalName}</p>
            <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
              {media.mimeType} · {formatBytes(media.size)}
              {media.width && media.height ? ` · ${media.width}×${media.height}` : ""}
              {media.pageCount !== undefined ? ` · ${media.pageCount} pages` : ""}
            </p>
            <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
              {media.status} · Uploaded {formatDate(media.createdAt)}
            </p>
          </div>

          <div>
            <label htmlFor="altText" className="mb-1 block text-xs font-semibold text-black/60 dark:text-white/60">
              Alt text
            </label>
            <textarea
              id="altText"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Describe this file for accessibility and search"
              className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-black/60 dark:text-white/60">
              Used in {usages ? usages.length : "…"}
              {usages && usages.length === 1 ? " place" : " places"}
            </p>
            {usages && usages.length > 0 && (
              <ul className="max-h-24 space-y-0.5 overflow-y-auto text-xs text-black/55 dark:text-white/55">
                {usages.map((u, i) => (
                  <li key={`${u.entityType}-${u.entityId}-${i}`}>
                    <span className="font-semibold">{u.entityType.toLowerCase()}</span> · {u.label || u.entityId}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {updateMutation.isError && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">Couldn&apos;t save. Please try again.</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateMutation.mutate({ altText })}
              disabled={updateMutation.isPending || altText === (media.altText ?? "")}
              className="rounded-full bg-admin-primary-dark px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-admin-primary dark:text-black"
            >
              {updateMutation.isPending ? "Saving…" : "Save alt text"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={Boolean(usages && usages.length > 0)}
              title={usages && usages.length > 0 ? "Remove all references before deleting" : undefined}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-40 dark:text-red-400"
            >
              <IconTrash className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
