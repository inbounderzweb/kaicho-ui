"use client";

import Container from "../ui/Container";
import SearchBox from "./SearchBox";
import ProductSort from "./ProductSort";
import ProductFilters from "./ProductFilters";
import ProductGrid from "./ProductGrid";
import Pagination from "./Pagination";
import { useCatalogFilters } from "@/lib/hooks/useCatalogFilters";
import { useProducts } from "@/lib/hooks/useProducts";

// The /products listing page: search + filter + sort + server-side
// pagination, all driven by the URL (useCatalogFilters) so the page is
// refresh-safe, back-button-safe, and shareable/bookmarkable as a link.
export default function ProductsPageClient() {
  const filters = useCatalogFilters();

  const { data, isLoading, isError, refetch } = useProducts({
    page: filters.page,
    search: filters.search || undefined,
    category: filters.category || undefined,
    brand: filters.brand || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    inStock: filters.inStock,
    sort: filters.sort,
    order: filters.order,
  });

  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 24;
  const rangeStart = total === 0 ? 0 : (filters.page - 1) * pageSize + 1;
  const rangeEnd = Math.min(filters.page * pageSize, total);

  return (
    <Container className="py-8 sm:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <ProductFilters
          value={{
            category: filters.category || undefined,
            brand: filters.brand,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            inStock: filters.inStock,
          }}
          onChange={(patch) => filters.update(patch)}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:max-w-xs sm:flex-1">
              <SearchBox value={filters.search} onChange={(search) => filters.update({ search })} />
            </div>
            <ProductSort
              sort={filters.sort}
              order={filters.order}
              onChange={(sort, order) => filters.update({ sort, order })}
            />
          </div>

          {!isLoading && (
            <p className="mt-4 text-sm text-ink-muted">
              {total === 0 ? "No products" : `Showing ${rangeStart}–${rangeEnd} of ${total} products`}
            </p>
          )}

          <div className="mt-4">
            {isError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
                <p className="text-base font-semibold text-ink">Something went wrong</p>
                <p className="mt-1 text-sm text-ink-muted">We couldn&apos;t load products right now.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            ) : (
              <ProductGrid
                items={data?.items ?? []}
                isLoading={isLoading}
                emptyDescription={
                  filters.search || filters.category || filters.brand
                    ? "Try adjusting your search or filters."
                    : "Check back soon for new products."
                }
              />
            )}
          </div>

          {data && <Pagination page={filters.page} pageSize={pageSize} total={total} onPageChange={(p) => filters.update({ page: p }, false)} />}
        </div>
      </div>
    </Container>
  );
}
