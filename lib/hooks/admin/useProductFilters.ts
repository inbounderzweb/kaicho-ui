"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ProductQueryParams } from "../../api/product";

export interface ProductFiltersState {
  page: number;
  pageSize: number;
  search: string;
  categoryId: string;
  brandId: string;
  status: NonNullable<ProductQueryParams["status"]>;
  isFeatured: NonNullable<ProductQueryParams["isFeatured"]>;
  minPrice: string;
  maxPrice: string;
  inStock: NonNullable<ProductQueryParams["inStock"]>;
  sort: NonNullable<ProductQueryParams["sort"]>;
  order: NonNullable<ProductQueryParams["order"]>;
}

type Patch = Partial<Record<keyof ProductFiltersState, string | number | undefined>>;

// Same URL-state pattern as useCategoryFilters/useBrandFilters/useMediaFilters
// — filters live in the URL so they survive refresh/back-button and are
// shareable, and server-side pagination/filtering means the frontend never
// fetches more than one page of products at a time.
export function useProductFilters(): ProductFiltersState & {
  update: (patch: Patch, resetPage?: boolean) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: ProductFiltersState = {
    page: Number(searchParams.get("page") ?? "1") || 1,
    pageSize: Number(searchParams.get("pageSize") ?? "20") || 20,
    search: searchParams.get("search") ?? "",
    categoryId: searchParams.get("categoryId") ?? "",
    brandId: searchParams.get("brandId") ?? "",
    status: (searchParams.get("status") as ProductFiltersState["status"]) ?? "all",
    isFeatured: (searchParams.get("isFeatured") as ProductFiltersState["isFeatured"]) ?? "all",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    inStock: (searchParams.get("inStock") as ProductFiltersState["inStock"]) ?? "all",
    sort: (searchParams.get("sort") as ProductFiltersState["sort"]) ?? "createdAt",
    order: (searchParams.get("order") as ProductFiltersState["order"]) ?? "desc",
  };

  function update(patch: Patch, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === "all") {
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
