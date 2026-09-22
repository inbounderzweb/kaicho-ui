"use client";

import { useEffect, useRef } from "react";
import type { PackRecommendation } from "@/lib/api/pack";

// The "Better Pack Available" dialog (spec §13): shown after the customer
// picks a quantity and clicks Add to Cart, when the backend found an
// applicable pack combination for that quantity. Never forces the pack —
// Keep Current always adds the plain unit line exactly as before this
// feature existed. Same interaction contract as CancelOrderDialog
// (role="alertdialog", Escape to dismiss, body scroll locked).
export default function PackRecommendationModal({
  open,
  quantity,
  recommendation,
  onKeepCurrent,
  onChoosePack,
  onDismiss,
}: {
  open: boolean;
  quantity: number;
  recommendation: PackRecommendation | null;
  onKeepCurrent: () => void;
  onChoosePack: () => void;
  onDismiss: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onDismiss]);

  if (!open || !recommendation?.applicable || !recommendation.breakdown) return null;

  const { breakdown, totalPrice = 0, savings = 0 } = recommendation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onDismiss} />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-label="Better pack available"
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-white p-5 shadow-xl"
      >
        <h2 className="font-display text-base font-bold text-ink">Better Pack Available</h2>
        <p className="mt-2 text-sm text-ink-muted">
          You&apos;re adding {quantity} units. Switch to this pack instead?
        </p>

        <div className="mt-4 rounded-xl border border-border bg-cream/40 p-3">
          {breakdown.map((line) => (
            <div key={line.packId} className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">
                {line.packName} × {line.packCount}
              </span>
              <span className="text-ink-muted">Rs. {(line.packPrice * line.packCount).toFixed(2)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-bold text-ink">
            <span>Total</span>
            <span>Rs. {totalPrice.toFixed(2)}</span>
          </div>
          {savings > 0 && (
            <p className="mt-1 text-xs font-semibold text-brand">You save Rs. {savings.toFixed(2)}</p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onKeepCurrent}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:border-brand hover:text-brand"
          >
            Keep Current
          </button>
          <button
            type="button"
            onClick={onChoosePack}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Choose Pack
          </button>
        </div>
      </div>
    </div>
  );
}
