"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { PublicSortField, PublicSortOrder } from "../api/publicProducts";

// Same URL-state pattern as the admin panel's useProductFilters/
// useCategoryFilters/useBrandFilters (see lib/hooks/admin/useProductFilters.ts)
// — filters live in the URL so they survive refresh/back-button and are
// shareable/bookmarkable links, and every filter change re-fetches exactly
// one server-paginated page rather than filtering client-side.
export interface CatalogFiltersState {
  page: number;
  search: string;
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sort: PublicSortField;
  order: PublicSortOrder;
}

type Patch = Partial<{
  page: number;
  search: string | undefined;
  category: string | undefined;
  brand: string | undefined;
  minPrice: string | undefined;
  maxPrice: string | undefined;
  inStock: boolean;
  sort: PublicSortField | undefined;
  order: PublicSortOrder | undefined;
}>;

export function useCatalogFilters(): CatalogFiltersState & {
  update: (patch: Patch, resetPage?: boolean) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: CatalogFiltersState = {
    page: Number(searchParams.get("page") ?? "1") || 1,
    search: searchParams.get("search") ?? "",
    category: searchParams.get("category") ?? "",
    brand: searchParams.get("brand") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    inStock: searchParams.get("inStock") === "true",
    sort: (searchParams.get("sort") as PublicSortField) ?? "relevance",
    order: (searchParams.get("order") as PublicSortOrder) ?? "asc",
  };

  function update(patch: Patch, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === "relevance" || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    if (resetPage) params.delete("page");
    const qs = params.toString();
    router.replace((qs ? `${pathname}?${qs}` : pathname) as Parameters<typeof router.replace>[0], {
      scroll: false,
    });
  }

  return { ...state, update };
}
