"use client";

import { useEffect } from "react";

export interface FormErrorItem {
  field: string;
  label: string;
  message: string;
}

const MAX_SHOWN = 4;
const AUTO_DISMISS_MS = 6000;

/**
 * Small popup shown when a submit fails validation, so errors on fields that
 * are scrolled out of view aren't missed. Clicking an item jumps to its field.
 */
export default function FormErrorToast({
  items,
  onClose,
  onJump,
}: {
  items: FormErrorItem[];
  onClose: () => void;
  onJump: (field: string) => void;
}) {
  useEffect(() => {
    if (items.length === 0) return;
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [items, onClose]);

  if (items.length === 0) return null;

  const shown = items.slice(0, MAX_SHOWN);
  const more = items.length - shown.length;

  return (
    <div
      role="alert"
      className="fixed right-4 top-4 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-red-500/30 bg-admin-card p-3 shadow-xl dark:bg-admin-card-dark"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-red-600 dark:text-red-400">
          Fix {items.length} {items.length === 1 ? "field" : "fields"} to save
        </p>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="text-xs leading-none opacity-60 hover:opacity-100">
          ✕
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        {shown.map((it) => (
          <li key={it.field}>
            <button
              type="button"
              onClick={() => onJump(it.field)}
              className="w-full text-left text-xs hover:underline"
            >
              <span className="font-semibold">{it.label}:</span>{" "}
              <span className="text-black/60 dark:text-white/60">{it.message}</span>
            </button>
          </li>
        ))}
      </ul>
      {more > 0 && <p className="mt-1 text-[11px] text-black/50 dark:text-white/50">+{more} more</p>}
    </div>
  );
}
