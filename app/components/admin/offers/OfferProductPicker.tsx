"use client";

import { useState, type ReactNode } from "react";
import { useProductList } from "@/lib/hooks/admin/useProductList";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { resolveMediaUrl } from "@/lib/api/client";
import { IconClose, IconSearch } from "../../ui/icons";

export interface PickedProduct {
  id: string;
  name: string;
  sku?: string | null;
  sellingPrice?: number | null;
  /** Thumbnail, when known. */
  imageUrl?: string | null;
}

function Thumb({ url, name }: { url?: string | null; name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/5 text-[9px] font-semibold text-black/35 dark:bg-white/5 dark:text-white/35">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolveMediaUrl(url)} alt={name} className="h-full w-full object-cover" />
      ) : (
        "No img"
      )}
    </span>
  );
}

// Searchable multi-select for products. Selections show as removable rows
// (image, name, price); results come from the existing admin product list
// (search by name/SKU), so no new endpoint and no N+1. An empty selection is
// shown explicitly — it never silently means "all products".
export default function OfferProductPicker({
  label,
  hint,
  value,
  onChange,
  disabled,
  emptyText = "None — no products selected",
  headerAction,
}: {
  label: string;
  hint?: string;
  value: PickedProduct[];
  onChange: (next: PickedProduct[]) => void;
  disabled?: boolean;
  /** What to show while nothing is selected. */
  emptyText?: string;
  /** Optional control shown beside the label (e.g. "Same as products to buy"). */
  headerAction?: ReactNode;
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
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
          {label}
          <span className="ml-1.5 font-normal normal-case tracking-normal text-black/40 dark:text-white/40">
            ({value.length} selected)
          </span>
        </p>
        {headerAction}
      </div>
      {hint && <p className="mb-2 text-[11px] text-black/45 dark:text-white/45">{hint}</p>}

      {value.length > 0 ? (
        <ul className="mb-2 space-y-1.5">
          {value.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2.5 rounded-xl border border-admin-border bg-admin-surface p-1.5 pr-2 text-xs dark:border-admin-border-dark dark:bg-admin-surface-dark"
            >
              <Thumb url={p.imageUrl} name={p.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{p.name}</span>
                {p.sku && <span className="block truncate text-[11px] text-black/50 dark:text-white/50">{p.sku}</span>}
              </span>
              {typeof p.sellingPrice === "number" && (
                <span className="shrink-0 tabular-nums text-black/60 dark:text-white/60">₹{p.sellingPrice}</span>
              )}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${p.name}`}
                onClick={() => onChange(value.filter((x) => x.id !== p.id))}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black/50 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:text-white/50"
              >
                <IconClose className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 rounded-xl border border-dashed border-admin-border px-3 py-3 text-xs font-semibold text-black/50 dark:border-admin-border-dark dark:text-white/50">
          {emptyText}
        </p>
      )}

      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by name or SKU…"
          aria-label={`Search products — ${label}`}
          className="w-full rounded-xl border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
        />
      </div>

      {debounced && (
        <ul className="mt-2 max-h-60 divide-y divide-admin-border overflow-y-auto rounded-xl border border-admin-border dark:divide-admin-border-dark dark:border-admin-border-dark">
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
                    onChange([
                      ...value,
                      {
                        id: p.productId,
                        name: p.name,
                        sku: p.sku,
                        sellingPrice: p.pricing.sellingPrice,
                        imageUrl: p.image?.thumbnailUrl ?? p.image?.url ?? null,
                      },
                    ]);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-admin-primary/10 disabled:opacity-50"
                >
                  <Thumb url={p.image?.thumbnailUrl ?? p.image?.url} name={p.name} />
                  <span className="min-w-0 flex-1">
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
