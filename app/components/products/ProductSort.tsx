"use client";

import type { PublicSortField, PublicSortOrder } from "@/lib/api/publicProducts";

// Combines sort+order into single option values (spec: relevance / price
// asc / price desc / newest / name A-Z / name Z-A) since price and name
// each have a meaningful direction, but relevance/newest don't need one
// exposed to the user.
const OPTIONS: { value: string; label: string; sort: PublicSortField; order: PublicSortOrder }[] = [
  { value: "relevance", label: "Relevance", sort: "relevance", order: "asc" },
  { value: "price-asc", label: "Price: Low to High", sort: "price", order: "asc" },
  { value: "price-desc", label: "Price: High to Low", sort: "price", order: "desc" },
  { value: "newest", label: "Newest", sort: "createdAt", order: "desc" },
  { value: "name-asc", label: "Name: A to Z", sort: "name", order: "asc" },
  { value: "name-desc", label: "Name: Z to A", sort: "name", order: "desc" },
];

export default function ProductSort({
  sort,
  order,
  onChange,
}: {
  sort: PublicSortField;
  order: PublicSortOrder;
  onChange: (sort: PublicSortField, order: PublicSortOrder) => void;
}) {
  const current = OPTIONS.find((o) => o.sort === sort && o.order === order)?.value ?? "relevance";

  return (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      <span className="hidden sm:inline">Sort by</span>
      <select
        aria-label="Sort products"
        value={current}
        onChange={(e) => {
          const opt = OPTIONS.find((o) => o.value === e.target.value);
          if (opt) onChange(opt.sort, opt.order);
        }}
        className="h-10 rounded-full border border-border bg-white px-3.5 text-sm font-medium text-ink focus:border-brand focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
