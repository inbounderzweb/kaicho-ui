"use client";

import { useCategories } from "@/lib/hooks/useCategories";
import { usePublicBrands } from "@/lib/hooks/usePublicBrands";
import type { PublicSortField, PublicSortOrder } from "@/lib/api/publicProducts";
import ProductFilters, { type ProductFiltersValue } from "./ProductFilters";
import ProductSort from "./ProductSort";

// Small-screen only: a single horizontally sliding line (Flipkart-style) —
// Filters drawer trigger, Sort, then quick category and brand chips. Anything
// that doesn't fit is reached by sliding the row instead of wrapping.
export default function MobileFilterBar({
  category,
  onCategoryChange,
  filters,
  onFiltersChange,
  sort,
  order,
  onSortChange,
}: {
  category: string | undefined;
  onCategoryChange: (slug: string | undefined) => void;
  filters: ProductFiltersValue;
  onFiltersChange: (patch: Partial<ProductFiltersValue>) => void;
  sort: PublicSortField;
  order: PublicSortOrder;
  onSortChange: (sort: PublicSortField, order: PublicSortOrder) => void;
}) {
  const { data: categories } = useCategories();
  const { data: brands } = usePublicBrands();

  return (
    <div className="no-scrollbar -mx-4 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-1 sm:hidden">
      <div className="shrink-0">
        <ProductFilters layout="toolbar" showCategoryFilter={false} value={filters} onChange={onFiltersChange} />
      </div>
      <div className="shrink-0">
        <ProductSort sort={sort} order={order} onChange={onSortChange} />
      </div>
      <span className="h-6 w-px shrink-0 bg-border" aria-hidden="true" />
      <Chip label="All" selected={!category} onClick={() => onCategoryChange(undefined)} />
      {categories?.categories.map((cat) => (
        <Chip
          key={cat.categoryId}
          label={cat.name}
          selected={category === cat.slug}
          onClick={() => onCategoryChange(category === cat.slug ? undefined : cat.slug)}
        />
      ))}
      {brands?.brands.map((brand) => (
        <Chip
          key={brand.brandId}
          label={brand.name}
          selected={filters.brand === brand.slug}
          onClick={() => onFiltersChange({ brand: filters.brand === brand.slug ? undefined : brand.slug })}
        />
      ))}
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors ${
        selected ? "border-brand bg-brand text-white" : "border-border bg-white text-ink-muted"
      }`}
    >
      {label}
    </button>
  );
}
