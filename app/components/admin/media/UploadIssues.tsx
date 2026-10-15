"use client";

import type { RejectedFile } from "@/lib/media/uploadRules";

// Per-file outcome list for a bulk upload: every file that didn't make it, with
// the specific reason, so one bad image never hides behind a generic failure
// (and the good ones still went through). Dismissible; stays until closed.
const VISIBLE_ROWS = 6;

export default function UploadIssues({
  issues,
  uploadedCount,
  onDismiss,
  className = "",
}: {
  issues: RejectedFile[];
  /** How many files of this batch were uploaded successfully (for the headline). */
  uploadedCount: number;
  onDismiss: () => void;
  className?: string;
}) {
  if (issues.length === 0) return null;

  const total = issues.length + uploadedCount;
  const shown = issues.slice(0, VISIBLE_ROWS);
  const more = issues.length - shown.length;

  return (
    <div
      role="alert"
      className={`mt-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-red-600 dark:text-red-400">
          {uploadedCount > 0
            ? `${uploadedCount} of ${total} uploaded — ${issues.length} not uploaded`
            : `${issues.length} ${issues.length === 1 ? "file was" : "files were"} not uploaded`}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="leading-none opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        {shown.map((item, i) => (
          <li key={`${item.name}-${i}`} className="break-words">
            <span className="font-semibold">{item.name}</span>
            <span className="text-black/60 dark:text-white/60"> — {item.reason}</span>
          </li>
        ))}
      </ul>
      {more > 0 && <p className="mt-1 text-[11px] text-black/50 dark:text-white/50">+{more} more</p>}
      <p className="mt-2 text-[11px] text-black/50 dark:text-white/50">
        Fix or replace these files and add them again — the rest are already saved.
      </p>
    </div>
  );
}
