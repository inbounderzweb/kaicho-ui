"use client";

import { useState } from "react";
import { useProductList } from "@/lib/hooks/admin/useProductList";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { IconClose, IconSearch } from "../../ui/icons";

export interface PickedProduct {
  id: string;
  name: string;
  sku?: string | null;
  sellingPrice?: number | null;
}

// Searchable multi-select for products. Selections show as removable chips;
// results come from the existing admin product list (search by name/SKU), so
// no new endpoint and no N+1.
export default function OfferProductPicker({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: PickedProduct[];
  onChange: (next: PickedProduct[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 300);
  const { data, isFetching } = useProductList({
    page: 1,
    pageSize: 8,
    search: debounced || undefined,
    status: "ACTIVE",
  });

  const selectedIds = new Set(value.map((p) => p.id));
  const results = (data?.items ?? []).filter((p) => !selectedIds.has(p.productId));

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">{label}</p>
      {hint && <p className="mb-2 text-[11px] text-black/45 dark:text-white/45">{hint}</p>}

      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((p) => (
            <li
              key={p.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-admin-border bg-admin-surface py-1 pl-3 pr-1.5 text-xs dark:border-admin-border-dark dark:bg-admin-surface-dark"
            >
              <span className="truncate font-semibold">{p.name}</span>
              {typeof p.sellingPrice === "number" && (
                <span className="shrink-0 text-black/50 dark:text-white/50">₹{p.sellingPrice}</span>
              )}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${p.name}`}
                onClick={() => onChange(value.filter((x) => x.id !== p.id))}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-black/50 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:text-white/50"
              >
                <IconClose className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by name or SKU…"
          className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
        />
      </div>

      {debounced && (
        <ul className="mt-2 max-h-56 divide-y divide-admin-border overflow-y-auto rounded-xl border border-admin-border dark:divide-admin-border-dark dark:border-admin-border-dark">
          {isFetching && results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-black/50 dark:text-white/50">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-xs text-black/50 dark:text-white/50">No matching active products.</li>
          ) : (
            results.map((p) => (
              <li key={p.productId}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange([...value, { id: p.productId, name: p.name, sku: p.sku, sellingPrice: p.pricing.sellingPrice }]);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-admin-primary/10 disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block truncate text-[11px] text-black/50 dark:text-white/50">{p.sku}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-black/60 dark:text-white/60">
                    ₹{p.pricing.sellingPrice}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
