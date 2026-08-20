"use client";

import { useState } from "react";
import { useCategories } from "@/lib/hooks/useCategories";
import { usePublicBrands } from "@/lib/hooks/usePublicBrands";
import { IconClose } from "../ui/icons";

export interface ProductFiltersValue {
  category?: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
}

export interface ProductFiltersProps {
  value: ProductFiltersValue;
  onChange: (patch: Partial<ProductFiltersValue>) => void;
  /** Hide the category filter — the category landing page already pins
   *  category via its route, so showing it again would be redundant. */
  showCategoryFilter?: boolean;
}

// Renders as a sticky sidebar on desktop and a slide-over drawer (trigger
// button + panel) on mobile — both wrap the same <FilterFields>, so the
// filtering logic only exists once.
export default function ProductFilters(props: ProductFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-ink"
        >
          Filters
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 rounded-2xl border border-border bg-white p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Filters</h2>
          <div className="mt-4">
            <FilterFields {...props} />
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-charcoal/40"
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-xs flex-col overflow-y-auto bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink">Filters</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:text-brand"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">
              <FilterFields {...props} />
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-6 h-11 w-full rounded-full bg-brand text-sm font-semibold text-white"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterFields({ value, onChange, showCategoryFilter = true }: ProductFiltersProps) {
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: brandsData, isLoading: brandsLoading } = usePublicBrands();

  return (
    <div className="space-y-6">
      {showCategoryFilter && (
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wide text-ink-faint">Category</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip
              label="All"
              selected={!value.category}
              onClick={() => onChange({ category: undefined })}
            />
            {categoriesLoading && <span className="text-xs text-ink-faint">Loading…</span>}
            {categoriesData?.categories.map((cat) => (
              <FilterChip
                key={cat.categoryId}
                label={cat.name}
                selected={value.category === cat.slug}
                onClick={() => onChange({ category: value.category === cat.slug ? undefined : cat.slug })}
              />
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wide text-ink-faint">Brand</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip label="All" selected={!value.brand} onClick={() => onChange({ brand: undefined })} />
          {brandsLoading && <span className="text-xs text-ink-faint">Loading…</span>}
          {brandsData?.brands.map((brand) => (
            <FilterChip
              key={brand.brandId}
              label={brand.name}
              selected={value.brand === brand.slug}
              onClick={() => onChange({ brand: value.brand === brand.slug ? undefined : brand.slug })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wide text-ink-faint">Price (Rs.)</legend>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            aria-label="Minimum price"
            placeholder="Min"
            value={value.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:border-brand focus:outline-none"
          />
          <span className="text-ink-faint">–</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            aria-label="Maximum price"
            placeholder="Max"
            value={value.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            className="h-10 w-full rounded-lg border border-border px-3 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={value.inStock}
          onChange={(e) => onChange({ inStock: e.target.checked })}
          className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
        />
        In stock only
      </label>
    </div>
  );
}

function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        selected
          ? "border-brand bg-brand text-white"
          : "border-border text-ink-muted hover:border-brand hover:text-brand"
      }`}
    >
      {label}
    </button>
  );
}
