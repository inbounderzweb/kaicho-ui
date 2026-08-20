"use client";

import { useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "@/lib/api/client";
import { useMediaList } from "@/lib/hooks/admin/useMediaList";
import { useMediaFilters } from "@/lib/hooks/admin/useMediaFilters";
import { useUploadMedia } from "@/lib/hooks/admin/useUploadMedia";
import { useUpdateMedia } from "@/lib/hooks/admin/useUpdateMedia";
import { useDeleteMedia } from "@/lib/hooks/admin/useDeleteMedia";
import type { AdminMedia } from "@/lib/api/media";
import AdminPagination from "./AdminPagination";
import ConfirmDialog from "./ConfirmDialog";
import { IconSearch, IconUploadCloud, IconFileText, IconClose, IconTrash } from "../ui/icons";

// Client-side pre-check only — pure UX (skip an obviously-doomed upload
// before it leaves the browser). The backend re-validates every file by
// content signature regardless; this list/these limits are not the
// security boundary.
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"];
const MAX_IMAGE_MB = 10;
const MAX_PDF_MB = 20;
const MAX_FILES_PER_REQUEST = 10;

interface QueuedFile {
  id: string;
  file: File;
  status: "queued" | "error";
  error?: string;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return "Unsupported file type";
  }
  const isPdf = file.type === "application/pdf";
  const maxBytes = (isPdf ? MAX_PDF_MB : MAX_IMAGE_MB) * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Exceeds the ${isPdf ? MAX_PDF_MB : MAX_IMAGE_MB}MB limit`;
  }
  return null;
}

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
  const { data, isLoading, isError, refetch, isPlaceholderData } = useMediaList(filters);
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();

  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [queueNote, setQueueNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [selected, setSelected] = useState<AdminMedia | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminMedia | null>(null);

  const addFiles = (incoming: FileList | File[]) => {
    const files = Array.from(incoming);
    setQueue((prev) => {
      const room = MAX_FILES_PER_REQUEST - prev.length;
      const accepted = files.slice(0, Math.max(0, room));
      if (files.length > accepted.length) {
        setQueueNote(`Only ${MAX_FILES_PER_REQUEST} files are allowed per upload — the rest were skipped.`);
      } else {
        setQueueNote(null);
      }
      const next: QueuedFile[] = accepted.map((file) => {
        const error = validateFile(file);
        return {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          status: error ? "error" : "queued",
          error: error ?? undefined,
        };
      });
      return [...prev, ...next];
    });
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const clearQueue = () => {
    setQueue([]);
    setUploadProgress(0);
    setQueueNote(null);
  };

  const submitQueue = () => {
    const toUpload = queue.filter((q) => q.status === "queued").map((q) => q.file);
    if (toUpload.length === 0) return;
    setUploadProgress(0);
    uploadMutation.mutate(
      { files: toUpload, onProgress: setUploadProgress },
      {
        onSuccess: (result) => {
          if (result.errors.length === 0) {
            clearQueue();
            return;
          }
          // Keep only the server-rejected files in the queue, as errors —
          // everything that succeeded drops out, matching "retry failed
          // upload" without re-submitting files that already made it in.
          setQueue((prev) =>
            prev
              .filter((q) => q.status === "queued")
              .flatMap((q) => {
                const failure = result.errors.find((e) => e.originalName === q.file.name);
                return failure ? [{ ...q, status: "error" as const, error: failure.message }] : [];
              })
          );
        },
      }
    );
  };

  const hasQueuedFiles = queue.some((q) => q.status === "queued");
  const hasActiveFilters = Boolean(filters.search || filters.status !== "all" || filters.mediaType !== "all");

  const clearFilters = () => {
    setSearchInput("");
    filters.update({ search: undefined, status: undefined, mediaType: undefined });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Media Library</h1>
        <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
          Upload and manage images and PDFs. New uploads stay temporary until a future module attaches them.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-admin-primary-dark bg-admin-primary/10 dark:border-admin-primary"
            : "border-admin-border dark:border-admin-border-dark"
        }`}
      >
        <IconUploadCloud className="mx-auto h-8 w-8 text-black/40 dark:text-white/40" />
        <p className="mt-2 text-sm font-semibold">Drag files here or</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
        >
          Select Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-3 text-xs text-black/45 dark:text-white/45">
          JPG · PNG · WEBP · AVIF · PDF — Images: max {MAX_IMAGE_MB}MB, PDF: max {MAX_PDF_MB}MB, maximum{" "}
          {MAX_FILES_PER_REQUEST} files per request
        </p>
        {queueNote && <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">{queueNote}</p>}
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark">
          <div className="space-y-2">
            {queue.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-admin-border px-3 py-2 text-sm dark:border-admin-border-dark"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{q.file.name}</p>
                  <p className="text-xs text-black/50 dark:text-white/50">
                    {formatBytes(q.file.size)}
                    {q.status === "error" && q.error ? ` — ${q.error}` : ""}
                  </p>
                </div>
                {q.status === "error" && (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                    Error
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeFromQueue(q.id)}
                  aria-label={`Remove ${q.file.name}`}
                  className="shrink-0 rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {uploadMutation.isPending && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full bg-admin-primary-dark transition-all dark:bg-admin-primary"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={submitQueue}
              disabled={!hasQueuedFiles || uploadMutation.isPending}
              className="rounded-full bg-admin-primary-dark px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-admin-primary dark:text-black"
            >
              {uploadMutation.isPending
                ? `Uploading… ${uploadProgress}%`
                : `Upload ${queue.filter((q) => q.status === "queued").length} file(s)`}
            </button>
            <button type="button" onClick={clearQueue} className="text-xs font-semibold text-black/55 hover:underline dark:text-white/55">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[200px] flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by filename or alt text..."
            className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark dark:focus:border-admin-primary"
          />
        </div>

        <select
          value={filters.mediaType}
          onChange={(e) => filters.update({ mediaType: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">All types</option>
          <option value="IMAGE">Images</option>
          <option value="DOCUMENT">PDFs</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => filters.update({ status: e.target.value })}
          className="rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
        >
          <option value="all">All statuses</option>
          <option value="TEMPORARY">Temporary</option>
          <option value="ATTACHED">Attached</option>
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
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
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
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">Upload a file or try changing your filters.</p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5 ${
              isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"
            }`}
          >
            {data.items.map((item) => (
              <button
                key={item.mediaId}
                type="button"
                onClick={() => setSelected(item)}
                className="group relative flex aspect-square flex-col overflow-hidden rounded-xl border border-admin-border text-left dark:border-admin-border-dark"
              >
                {item.mediaType === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(item.thumbnailUrl!)}
                    alt={item.altText ?? item.originalName}
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
                <span
                  className={`absolute m-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    item.status === "TEMPORARY"
                      ? "bg-amber-500/90 text-white"
                      : "bg-emerald-500/90 text-white"
                  }`}
                >
                  {item.status}
                </span>
              </button>
            ))}
          </div>
        )}
        {data && !isLoading && !isError && (
          <AdminPagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={data.total}
            itemLabel="files"
            onPageChange={(p) => filters.update({ page: p }, false)}
            onPageSizeChange={(size) => filters.update({ pageSize: size })}
          />
        )}
      </div>

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
        description={`"${deleteTarget?.originalName}" and its stored file(s) will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.mediaId, { onSettled: () => setDeleteTarget(null) });
        }}
        onCancel={() => setDeleteTarget(null)}
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400"
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
