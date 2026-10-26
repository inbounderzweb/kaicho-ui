"use client";

import { useState } from "react";
import { useSimulateOffer } from "@/lib/hooks/admin/useOffers";
import { ApiError } from "@/lib/api/ApiError";
import OfferProductPicker, { type PickedProduct } from "./OfferProductPicker";

interface SimLine extends PickedProduct {
  quantity: number;
  /** Blank = let the server pick. Any filled value switches to manual picks. */
  free: string;
}

// Admin "Preview": runs the REAL pairing engine on the server against live
// DB prices for a hypothetical cart — works while the offer is still a draft.
export default function OfferSimulator({ offerId, type = "BOGO" }: { offerId: string; type?: "BOGO" | "PERCENTAGE" | "FIXED" }) {
  const isBogo = type === "BOGO";
  const [lines, setLines] = useState<SimLine[]>([]);
  const simulate = useSimulateOffer(offerId);

  const setLine = (id: string, patch: Partial<SimLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const run = () => {
    const manual = isBogo && lines.some((l) => l.free.trim() !== "");
    simulate.mutate({
      items: lines.map((l) => ({ productId: l.id, quantity: l.quantity })),
      freeSelections: manual
        ? lines
            .filter((l) => Number(l.free) > 0)
            .map((l) => ({ productId: l.id, quantity: Math.min(Number(l.free), l.quantity) }))
        : undefined,
    });
  };

  const result = simulate.data;
  const error = simulate.error instanceof ApiError ? simulate.error.message : simulate.error ? "Couldn't run the preview." : null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-black/55 dark:text-white/55">
        Build a sample cart to see exactly what a customer would get. Uses live prices and the same rules as checkout.
      </p>

      <OfferProductPicker
        label="Add products to the sample cart"
        value={lines}
        onChange={(next) =>
          setLines(next.map((p) => lines.find((l) => l.id === p.id) ?? { ...p, quantity: 1, free: "" }))
        }
      />

      {lines.length > 0 && (
        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-semibold">{l.name}</span>
              <label className="flex items-center gap-1 text-xs text-black/55 dark:text-white/55">
                Qty
                <input
                  type="number"
                  min={1}
                  value={l.quantity}
                  onChange={(e) => setLine(l.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-16 rounded-lg border border-admin-border bg-admin-surface px-2 py-1 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
              </label>
              {isBogo && (
              <label className="flex items-center gap-1 text-xs text-black/55 dark:text-white/55">
                Free
                <input
                  type="number"
                  min={0}
                  placeholder="auto"
                  value={l.free}
                  onChange={(e) => setLine(l.id, { free: e.target.value })}
                  className="w-16 rounded-lg border border-admin-border bg-admin-surface px-2 py-1 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark"
                />
              </label>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={run}
            disabled={simulate.isPending}
            className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {simulate.isPending ? "Calculating…" : "Run preview"}
          </button>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}

      {result && (
        <div className="space-y-2 rounded-xl border border-admin-border p-3 text-sm dark:border-admin-border-dark">
          {result.lines.map((l) => (
            <div key={l.productId} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate">{l.name ?? "Unknown product"}</span>
              <span className="shrink-0 tabular-nums text-xs text-black/60 dark:text-white/60">
                {isBogo
                  ? `${l.paidQuantity} paid${l.freeQuantity > 0 ? ` + ${l.freeQuantity} FREE` : ""} × ₹${l.unitPrice}`
                  : `${l.quantity} × ₹${l.unitPrice}${(l.discountAmount ?? 0) > 0 ? ` · −₹${l.discountAmount!.toFixed(2)}` : " · not discounted"}`}
              </span>
            </div>
          ))}
          <p className="border-t border-admin-border pt-2 font-semibold dark:border-admin-border-dark">
            Customer saves ₹{result.discountAmount.toFixed(2)}
            {isBogo ? ` (${result.freeUnits} free unit${result.freeUnits === 1 ? "" : "s"})` : ""}
          </p>
          {isBogo && result.needsFreeProduct && (
            <p className="text-xs text-black/55 dark:text-white/55">Add one of the offer&apos;s free products to the cart to unlock the free item.</p>
          )}
          {result.limitReached && (
            <p className="text-xs text-amber-700 dark:text-amber-400">The free-unit limit was reached.</p>
          )}
          {isBogo && result.discountAmount === 0 && result.unitsToNextFree > 0 && (
            <p className="text-xs text-black/55 dark:text-white/55">
              Add {result.unitsToNextFree} more eligible unit{result.unitsToNextFree === 1 ? "" : "s"} to unlock a free one.
            </p>
          )}
          {result.rejected.map((r, i) => (
            <p key={i} className="text-xs text-red-600 dark:text-red-400">
              Not free: {r.message}
            </p>
          ))}
          {result.skipped.map((s) => (
            <p key={s.productId} className="text-xs text-black/55 dark:text-white/55">
              Skipped a product: {s.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
