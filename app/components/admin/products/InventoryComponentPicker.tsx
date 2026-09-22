"use client";

import { useState } from "react";
import { useProductList } from "@/lib/hooks/admin/useProductList";
import type { InventoryComponentInput } from "@/lib/api/adminPack";

// Shared by both the product-level Inventory Tracking section and a pack's
// own component override — same search-then-add flow as
// CollectionDetailClient.tsx's inline product picker
// (useProductList({search, pageSize, status:"ACTIVE"}) + a local search
// input), pulled into one component only because it's now needed in two
// places rather than one.
export interface ComponentRow extends InventoryComponentInput {
  /** Display-only, filled in from the search result the row was added from (or a prior save) — never sent back to the API. */
  productName?: string;
}

export default function InventoryComponentPicker({
  value,
  onChange,
  excludeProductId,
}: {
  value: ComponentRow[];
  onChange: (next: ComponentRow[]) => void;
  /** The product/pack's own parent — offering it as its own component would be a no-op at best, confusing at worst. */
  excludeProductId?: string;
}) {
  const [search, setSearch] = useState("");
  const { data } = useProductList({ search: search || undefined, pageSize: 8, status: "ACTIVE" });
  const results = (data?.items ?? []).filter(
    (p) => p.productId !== excludeProductId && !value.some((c) => c.productId === p.productId)
  );

  function addComponent(productId: string, productName: string) {
    onChange([...value, { productId, productName, quantity: 1 }]);
    setSearch("");
  }

  function updateQuantity(productId: string, quantity: number) {
    onChange(value.map((c) => (c.productId === productId ? { ...c, quantity: Math.max(1, quantity) } : c)));
  }

  function removeComponent(productId: string) {
    onChange(value.filter((c) => c.productId !== productId));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="divide-y divide-admin-border rounded-xl border border-admin-border dark:divide-admin-border-dark dark:border-admin-border-dark">
          {value.map((c) => (
            <li key={c.productId} className="flex items-center justify-between gap-3 p-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.productName ?? c.productId}</span>
              <input
                type="number"
                min={1}
                value={c.quantity}
                onChange={(e) => updateQuantity(c.productId, Number(e.target.value))}
                className="w-20 rounded-lg border border-admin-border bg-admin-surface px-2 py-1 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
              />
              <button
                type="button"
                onClick={() => removeComponent(c.productId)}
                className="rounded-full border border-red-500/40 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add as a component..."
          className="w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
        />
        {search && results.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-admin-border bg-admin-card shadow-lg dark:border-admin-border-dark dark:bg-admin-card-dark">
            {results.map((p) => (
              <li key={p.productId}>
                <button
                  type="button"
                  onClick={() => addComponent(p.productId, p.name)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-admin-surface dark:hover:bg-admin-surface-dark"
                >
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-xs text-black/40 dark:text-white/40">Stock {p.inventory.stockQuantity}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
