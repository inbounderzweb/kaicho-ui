"use client";

import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl border border-admin-border bg-admin-card p-5 shadow-xl dark:border-admin-border-dark dark:bg-admin-card-dark"
      >
        <h2 className="text-base font-bold text-black dark:text-white">{title}</h2>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-full border border-admin-border px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-admin-border-dark"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50 ${
              destructive ? "bg-red-600 hover:opacity-90" : "bg-admin-primary-dark hover:opacity-90 dark:bg-admin-primary dark:text-black"
            }`}
          >
            {isConfirming ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
