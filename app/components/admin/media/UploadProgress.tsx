"use client";

import type { UploadPhase } from "@/lib/hooks/admin/useUploadPhase";
import { IconCheck } from "../../ui/icons";

// The one progress indicator every admin image-upload surface renders, driven
// by useUploadPhase. Shows a real-percentage bar while bytes upload, a
// "Processing…" pulse while the server works, a brief "Upload complete" tick,
// and a retryable error line. Fluid width + wrapping text keep it legible from
// ~320px phones up to desktop.
const LABELS: Record<Exclude<UploadPhase, "idle">, string> = {
  uploading: "Uploading…",
  processing: "Processing…",
  complete: "Upload complete",
  error: "Upload failed",
};

export default function UploadProgress({
  phase,
  percent,
  error,
  onRetry,
  className = "",
}: {
  phase: UploadPhase;
  percent: number;
  error?: string | null;
  /** What "Retry" does — re-open the picker, or re-send the last file. */
  onRetry?: () => void;
  className?: string;
}) {
  if (phase === "idle") return null;

  if (phase === "error") {
    return (
      <div
        role="alert"
        className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-red-600 dark:text-red-400 ${className}`}
      >
        <span>{error ?? "Something went wrong during the upload."}</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="underline underline-offset-2 hover:no-underline">
            Retry
          </button>
        )}
      </div>
    );
  }

  const done = phase === "complete";
  // "processing" has already sent every byte — fill the bar so it doesn't look
  // stalled at whatever the last progress event reported.
  const width = done || phase === "processing" ? 100 : Math.max(percent, 4);

  return (
    <div className={`mt-2 ${className}`} role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1.5 text-black/60 dark:text-white/60">
          {done ? (
            <IconCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
          ) : (
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-admin-primary-dark/30 border-t-admin-primary-dark dark:border-admin-primary/30 dark:border-t-admin-primary"
            />
          )}
          {LABELS[phase]}
        </span>
        <span className="tabular-nums text-black/45 dark:text-white/45">{done ? 100 : percent}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${
            done ? "bg-emerald-500" : "bg-admin-primary-dark dark:bg-admin-primary"
          } ${phase === "processing" ? "animate-pulse" : ""}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
