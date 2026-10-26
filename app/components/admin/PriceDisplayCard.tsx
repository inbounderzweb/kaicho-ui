"use client";

import { useState } from "react";
import { useUpdateStoreSettings } from "@/lib/hooks/admin/useUpdateStoreSettings";
import { ApiError } from "@/lib/api/ApiError";
import type { StoreSettings } from "@/lib/api/settings";

// One switch: show or hide the struck-through MRP and the "% OFF" labels
// across the storefront. Saved immediately, like a toggle should be.
export default function PriceDisplayCard({ settings }: { settings: StoreSettings }) {
  const saved = settings.showMrp !== false;
  const update = useUpdateStoreSettings();
  const [flash, setFlash] = useState(false);
  const on = update.isPending ? Boolean(update.variables?.showMrp) : saved;
  const error = update.error instanceof ApiError ? update.error.message : update.isError ? "Couldn't save. Please try again." : null;

  const toggle = (next: boolean) => {
    setFlash(false);
    update.mutate(
      { showMrp: next },
      {
        onSuccess: () => {
          setFlash(true);
          setTimeout(() => setFlash(false), 2500);
        },
      }
    );
  };

  return (
    <section className="max-w-xl space-y-3 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
      <div>
        <h2 className="text-sm font-bold">Price display</h2>
        <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
          Choose whether customers see the original price (MRP) and the discount labels. Individual products can override this under Product → Publishing → MRP &amp; discount labels.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          role="switch"
          checked={on}
          disabled={update.isPending}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-admin-primary-dark"
        />
        <span className="text-sm">
          <span className="font-semibold">Show MRP and discount labels</span>
          <span className="mt-0.5 block text-xs text-black/55 dark:text-white/55">
            {on
              ? "On: the struck-through MRP and “% OFF” labels appear next to prices."
              : "Off: only the selling price is shown. The MRP and “% OFF” labels are hidden on product cards, product pages, combos and the checkout summary."}
          </span>
        </span>
      </label>

      {error && <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}
      {flash && (
        <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          Saved.
        </p>
      )}
    </section>
  );
}
