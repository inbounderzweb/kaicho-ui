"use client";

import { useEffect, useState } from "react";
import { useInventoryTracking, useUpdateInventoryTracking } from "@/lib/hooks/admin/useInventoryTracking";
import InventoryComponentPicker, { type ComponentRow } from "./InventoryComponentPicker";
import { ApiError } from "@/lib/api/ApiError";

// Governs what a PLAIN purchase of this product deducts — this is what
// turns a product listing into a "combo" (spec: Admin-Configured Inventory
// Tracking). A specific Pack's own override lives inside
// PackConfigSection.tsx instead; the two are independent (§20: pack
// configuration is what's sold and at what price, inventory tracking is
// what that sale actually consumes).
export default function InventoryTrackingSection({ productId }: { productId: string }) {
  const { data } = useInventoryTracking(productId);
  const updateTracking = useUpdateInventoryTracking(productId);

  const [enabled, setEnabled] = useState(false);
  const [components, setComponents] = useState<ComponentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Seed local state from the fetched settings once, and again whenever the
  // productId changes — not on every refetch, so mid-edit local state
  // (components not yet saved) isn't clobbered by a background refresh.
  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setComponents(data.components.map((c) => ({ ...c })));
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, data === undefined]);

  function handleSave() {
    setError(null);
    updateTracking.mutate(
      { enabled, components: components.map(({ productId: pid, quantity }) => ({ productId: pid, quantity })) },
      {
        onSuccess: () => setDirty(false),
        onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't save inventory tracking."),
      }
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70">
          Inventory Tracking
        </h2>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked);
              setDirty(true);
            }}
            className="h-4 w-4 rounded"
          />
          Track inventory using component products
        </label>
      </div>

      {enabled && (
        <>
          <p className="text-xs text-black/50 dark:text-white/50">
            This product&apos;s own stock counter is ignored — buying it deducts the components below instead.
          </p>

          <InventoryComponentPicker
            value={components}
            onChange={(next) => {
              setComponents(next);
              setDirty(true);
            }}
            excludeProductId={productId}
          />

          {components.length > 0 && (
            <div className="rounded-xl border border-admin-border bg-admin-surface p-3 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50">
                When customer purchases 1:
              </p>
              {components.map((c) => (
                <p key={c.productId} className="tabular-nums">
                  {c.productName ?? c.productId} → -{c.quantity}
                </p>
              ))}
            </div>
          )}
        </>
      )}

      {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}

      {dirty && (
        <button
          type="button"
          disabled={updateTracking.isPending}
          onClick={handleSave}
          className="rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {updateTracking.isPending ? "Saving…" : "Save inventory tracking"}
        </button>
      )}
    </section>
  );
}
