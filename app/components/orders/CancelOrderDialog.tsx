"use client";

import { useEffect, useRef, useState } from "react";

// Same interaction contract as the admin panel's ConfirmDialog
// (role="alertdialog", Escape to cancel, body scroll locked while open,
// focus moved into the panel) — rebuilt here rather than imported because
// that component is styled with the --color-admin-* tokens, which are
// scoped to /admin and would look foreign on the storefront. The extra
// difference is the optional reason field, which the cancel endpoint takes.
export default function CancelOrderDialog({
  open,
  orderNumber,
  isCancelling,
  errorMessage,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  orderNumber: string;
  isCancelling: boolean;
  errorMessage?: string | null;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [reason, setReason] = useState("");

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
        aria-label={`Cancel order ${orderNumber}`}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-white p-5 shadow-xl"
      >
        <h2 className="font-display text-base font-bold text-ink">Cancel this order?</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Order {orderNumber} will be cancelled and any reserved stock released. This can&apos;t be undone.
        </p>

        <label htmlFor="cancel-reason" className="mt-4 mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Reason (optional)
        </label>
        <textarea
          id="cancel-reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          placeholder="Tell us why, so we can improve."
          className="w-full rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand"
        />

        {errorMessage && (
          <p className="mt-3 rounded-xl bg-sale/10 p-3 text-xs font-semibold text-sale">{errorMessage}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCancelling}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink-muted disabled:opacity-50"
          >
            Keep order
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={isCancelling}
            className="rounded-full bg-sale px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isCancelling ? "Cancelling…" : "Cancel order"}
          </button>
        </div>
      </div>
    </div>
  );
}
