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
  /** "sidebar" (default): permanent left column on desktop + drawer trigger
   *  on mobile — used by /category/:slug. "toolbar": always a compact
   *  trigger + slide-over drawer regardless of breakpoint, no permanent
   *  column — used by /products, which now leads with category pill tabs
   *  (ProductCategoryTabs) instead of a sidebar checklist, so only the
   *  secondary brand/price/stock filters live behind this drawer there. */
  layout?: "sidebar" | "toolbar";
}

// Renders as a sticky sidebar on desktop and a slide-over drawer (trigger
// button + panel) on mobile — both wrap the same <FilterFields>, so the
// filtering logic only exists once.
export default function ProductFilters(props: ProductFiltersProps) {
  const { layout = "sidebar" } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isToolbar = layout === "toolbar";
  const { value, onChange } = props;
  const activeCount =
    (value.brand ? 1 : 0) + (value.minPrice || value.maxPrice ? 1 : 0) + (props.showCategoryFilter !== false && value.category ? 1 : 0);

  return (
    <>
      {/* Trigger: mobile-only in sidebar mode (desktop has the permanent
          column instead); always shown in toolbar mode. */}
      <div className={isToolbar ? "" : "mb-4 lg:hidden"}>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand ${isToolbar ? "whitespace-nowrap" : ""}`}
        >
          Filters{activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs text-white">{activeCount}</span>
          )}
        </button>
      </div>

      {/* Desktop sidebar — sidebar layout only */}
      {!isToolbar && (
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-white p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Filters</h2>
            <div className="mt-4">
              <FilterFields {...props} />
            </div>
          </div>
        </aside>
      )}

      {/* Drawer: mobile-only in sidebar mode (desktop already has the
          column); every breakpoint in toolbar mode. */}
      {drawerOpen && (
        <div className={`fixed inset-0 z-50 ${isToolbar ? "" : "lg:hidden"}`}>
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-charcoal/40"
          />
          <div
            className={`absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-xl ${
              isToolbar ? "max-w-md" : "max-w-xs overflow-y-auto p-5"
            }`}
          >
            <div className={`flex items-center justify-between ${isToolbar ? "border-b border-border px-4 py-3" : ""}`}>
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
            {isToolbar ? (
              <TwoPaneFilters {...props} />
            ) : (
              <div className="mt-5">
                <FilterFields {...props} />
              </div>
            )}
            <div className={`flex gap-3 ${isToolbar ? "border-t border-border p-3" : "mt-6"}`}>
              {isToolbar && (
                <button
                  type="button"
                  onClick={() => onChange({ category: undefined, brand: undefined, minPrice: "", maxPrice: "" })}
                  className="h-11 flex-1 rounded-full border border-border text-sm font-semibold text-ink"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-11 flex-1 rounded-full bg-brand text-sm font-semibold text-white"
              >
                Show results
              </button>
            </div>
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

      {/* <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={value.inStock}
          onChange={(e) => onChange({ inStock: e.target.checked })}
          className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
        />
        In stock only
      </label> */}
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

// Flipkart-style side filter: section list on the left, that section's
// options on the right. Same hooks/handlers as FilterFields.
function TwoPaneFilters({ value, onChange, showCategoryFilter = true }: ProductFiltersProps) {
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = usePublicBrands();
  const sections = [
    ...(showCategoryFilter ? [{ id: "category", label: "Category", count: value.category ? 1 : 0 }] : []),
    { id: "brand", label: "Brand", count: value.brand ? 1 : 0 },
    { id: "price", label: "Price", count: value.minPrice || value.maxPrice ? 1 : 0 },
  ];
  const [active, setActive] = useState(sections[0].id);

  return (
    <div className="flex min-h-0 flex-1">
      <ul className="w-32 shrink-0 overflow-y-auto bg-cream/60">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => setActive(section.id)}
              aria-current={active === section.id}
              className={`flex w-full items-center justify-between gap-1 border-l-4 px-3 py-4 text-left text-sm font-semibold ${
                active === section.id ? "border-brand bg-white text-brand" : "border-transparent text-ink-muted"
              }`}
            >
              {section.label}
              {section.count > 0 && <span className="h-2 w-2 rounded-full bg-brand" />}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex-1 overflow-y-auto p-4">
        {active === "category" && (
          <OptionList
            options={(categoriesData?.categories ?? []).map((c) => ({ key: c.categoryId, label: c.name, slug: c.slug }))}
            selected={value.category}
            onSelect={(slug) => onChange({ category: slug })}
          />
        )}
        {active === "brand" && (
          <OptionList
            options={(brandsData?.brands ?? []).map((b) => ({ key: b.brandId, label: b.name, slug: b.slug }))}
            selected={value.brand}
            onSelect={(slug) => onChange({ brand: slug })}
          />
        )}
        {active === "price" && (
          <div className="flex items-center gap-2">
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
        )}
      </div>
    </div>
  );
}

function OptionList({
  options,
  selected,
  onSelect,
}: {
  options: { key: string; label: string; slug: string }[];
  selected: string | undefined;
  onSelect: (slug: string | undefined) => void;
}) {
  return (
    <ul className="space-y-1">
      {options.map((opt) => (
        <li key={opt.key}>
          <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={selected === opt.slug}
              onChange={() => onSelect(selected === opt.slug ? undefined : opt.slug)}
              className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
            />
            {opt.label}
          </label>
        </li>
      ))}
    </ul>
  );
}
