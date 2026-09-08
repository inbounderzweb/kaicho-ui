"use client";

import { useState } from "react";
import type { CheckoutPreviewCoupon } from "@/lib/api/checkout";
import { IconCheck } from "../ui/icons";

// Presentational only — all coupon state lives in CheckoutClient and every
// number comes from the server's /checkout/preview response. This never
// computes a discount.
export default function CouponField({
  appliedCode,
  coupon,
  couponError,
  isBusy,
  onApply,
  onRemove,
}: {
  /** The code currently being sent to the server (may be pending/invalid). */
  appliedCode: string | null;
  /** Server-confirmed applied coupon, or null. */
  coupon: CheckoutPreviewCoupon | null;
  /** Server's reason a sent code couldn't be applied. */
  couponError: string | null;
  isBusy: boolean;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const [input, setInput] = useState("");

  const submit = () => {
    const code = input.trim().toUpperCase();
    if (code) onApply(code);
  };

  if (coupon) {
    return (
      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-brand">
              <IconCheck className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">{coupon.code}</p>
              <p className="text-xs text-ink-muted">{coupon.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={isBusy}
            className="text-xs font-semibold text-sale hover:underline disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <label htmlFor="coupon" className="text-sm font-semibold text-ink">
        Have a coupon?
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="coupon"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Enter code"
          className="min-w-0 flex-1 rounded-xl border border-border bg-cream/50 px-3 py-2.5 text-sm font-medium uppercase tracking-wide text-ink outline-none transition-colors focus:border-forest"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isBusy || !input.trim()}
          className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand/40"
        >
          {isBusy ? "…" : "Apply"}
        </button>
      </div>
      {couponError && appliedCode && (
        <p className="mt-2 text-xs font-semibold text-sale">{couponError}</p>
      )}
    </section>
  );
}
