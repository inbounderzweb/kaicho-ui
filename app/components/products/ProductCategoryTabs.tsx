"use client";

import { useCategories } from "@/lib/hooks/useCategories";

// Horizontal pill tabs for category selection — replaces the checkbox-list
// category fieldset that used to live inside ProductFilters' sidebar on
// /products (still used as-is on /category/:slug and stays there). Real
// categories only, via the same useCategories() the old sidebar used.
export default function ProductCategoryTabs({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (slug: string | undefined) => void;
}) {
  const { data, isLoading } = useCategories();

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        aria-pressed={!value}
        className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          !value ? "bg-brand text-white" : "border border-border text-ink-muted hover:border-brand/40 hover:text-brand"
        }`}
      >
        All Products
      </button>

      {isLoading &&
        Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-cream" />
        ))}

      {data?.categories.map((cat) => (
        <button
          key={cat.categoryId}
          type="button"
          onClick={() => onChange(cat.slug)}
          aria-pressed={value === cat.slug}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            value === cat.slug
              ? "bg-brand text-white"
              : "border border-border text-ink-muted hover:border-brand/40 hover:text-brand"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
