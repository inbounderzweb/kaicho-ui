"use client";

import { useRef, useState } from "react";
import { useUploadMedia } from "@/lib/hooks/admin/useUploadMedia";
import { useUploadPhase } from "@/lib/hooks/admin/useUploadPhase";
import type { UploadedMedia } from "@/lib/api/media";
import { IconUploadCloud, IconClose } from "../../ui/icons";
import UploadProgress from "./UploadProgress";

// The shared "Upload New" surface — drag/drop + a validated queue + a progress
// bar. Extracted verbatim from the old MediaLibraryClient so the /admin/media
// page and the "Upload New" tab of MediaLibraryModal behave identically.
//
// Client-side checks here are pure UX (skip an obviously-doomed upload before
// it leaves the browser); the backend re-validates every file by content
// signature regardless.
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALL_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"];
const MAX_IMAGE_MB = 10;
const MAX_PDF_MB = 20;
const MAX_FILES_PER_REQUEST = 10;

interface QueuedFile {
  id: string;
  file: File;
  status: "queued" | "error";
  error?: string;
}

function validateFile(file: File, imagesOnly: boolean, maxImageMb: number): string | null {
  const accepted = imagesOnly ? IMAGE_MIME_TYPES : ALL_MIME_TYPES;
  if (!accepted.includes(file.type)) return "Unsupported file type";
  const isPdf = file.type === "application/pdf";
  const maxBytes = (isPdf ? MAX_PDF_MB : maxImageMb) * 1024 * 1024;
  if (file.size > maxBytes) return `Exceeds the ${isPdf ? MAX_PDF_MB : maxImageMb}MB limit`;
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaUploadPanel({
  imagesOnly = false,
  multiple = true,
  maxImageMb = MAX_IMAGE_MB,
  onUploaded,
}: {
  imagesOnly?: boolean;
  multiple?: boolean;
  maxImageMb?: number;
  /** Fired with the assets that made it in (new or deduped to an existing one). */
  onUploaded: (items: UploadedMedia[]) => void;
}) {
  const uploadMutation = useUploadMedia();
  const upload = useUploadPhase();
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (imagesOnly ? IMAGE_MIME_TYPES : ALL_MIME_TYPES).join(",");

  const addFiles = (incoming: FileList | File[]) => {
    const files = Array.from(incoming);
    setQueue((prev) => {
      const cap = multiple ? MAX_FILES_PER_REQUEST : 1;
      const room = cap - prev.length;
      const accepted = files.slice(0, Math.max(0, room));
      setNote(
        files.length > accepted.length
          ? `Only ${cap} file${cap === 1 ? "" : "s"} allowed per upload — the rest were skipped.`
          : null
      );
      const next: QueuedFile[] = accepted.map((file) => {
        const error = validateFile(file, imagesOnly, maxImageMb);
        return {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          status: error ? "error" : "queued",
          error: error ?? undefined,
        };
      });
      return multiple ? [...prev, ...next] : next;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    upload.reset();
    setNote(null);
  };

  const submit = () => {
    if (upload.isBusy) return; // guard against a double upload
    const toUpload = queue.filter((q) => q.status === "queued").map((q) => q.file);
    if (toUpload.length === 0) return;
    upload.start();
    uploadMutation.mutate(
      { files: toUpload, onProgress: upload.handleProgress },
      {
        onSuccess: (result) => {
          if (result.data.length > 0) onUploaded(result.data);
          if (result.errors.length === 0) {
            upload.succeed();
            setQueue([]);
            setNote(null);
            return;
          }
          // Partial: keep only the rejected rows, tagged with their reason.
          setQueue((prev) =>
            prev
              .filter((q) => q.status === "queued")
              .flatMap((q) => {
                const failure = result.errors.find((e) => e.originalName === q.file.name);
                return failure ? [{ ...q, status: "error" as const, error: failure.message }] : [];
              })
          );
          if (result.data.length > 0) {
            upload.succeed();
          } else {
            upload.failWith("Some files couldn't be uploaded — see the details below.");
          }
        },
        onError: () => upload.failWith("Network error during upload. Please try again."),
      }
    );
  };

  const queuedCount = queue.filter((q) => q.status === "queued").length;

  return (
    <div className="space-y-4">
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
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
        >
          Select File{multiple ? "s" : ""}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-3 text-xs text-black/45 dark:text-white/45">
          {imagesOnly ? "JPG · PNG · WEBP · AVIF" : "JPG · PNG · WEBP · AVIF · PDF"} — Images: max{" "}
          {maxImageMb}MB{imagesOnly ? "" : `, PDF: max ${MAX_PDF_MB}MB`}
          {multiple ? `, up to ${MAX_FILES_PER_REQUEST} files` : ""}
        </p>
        {note && <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">{note}</p>}
      </div>

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
                  onClick={() => setQueue((prev) => prev.filter((x) => x.id !== q.id))}
                  aria-label={`Remove ${q.file.name}`}
                  className="shrink-0 rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <UploadProgress
            phase={upload.phase}
            percent={upload.percent}
            error={upload.error}
            onRetry={submit}
            className="mt-3"
          />

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={queuedCount === 0 || upload.isBusy}
              className="rounded-full bg-admin-primary-dark px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-admin-primary dark:text-black"
            >
              {upload.isBusy ? "Uploading…" : `Upload ${queuedCount} file(s)`}
            </button>
            <button
              type="button"
              onClick={clearQueue}
              className="text-xs font-semibold text-black/55 hover:underline dark:text-white/55"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
