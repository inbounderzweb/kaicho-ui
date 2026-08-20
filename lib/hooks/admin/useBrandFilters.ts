"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { BrandQueryParams } from "../../api/brand";

export interface BrandFiltersState {
  page: number;
  pageSize: number;
  search: string;
  isActive: NonNullable<BrandQueryParams["isActive"]>;
  sort: NonNullable<BrandQueryParams["sort"]>;
  order: NonNullable<BrandQueryParams["order"]>;
}

type Patch = Partial<Record<keyof BrandFiltersState, string | number | undefined>>;

// Same URL-state pattern as useCategoryFilters/useUsersFilters/useMediaFilters.
export function useBrandFilters(): BrandFiltersState & {
  update: (patch: Patch, resetPage?: boolean) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: BrandFiltersState = {
    page: Number(searchParams.get("page") ?? "1") || 1,
    pageSize: Number(searchParams.get("pageSize") ?? "20") || 20,
    search: searchParams.get("search") ?? "",
    isActive: (searchParams.get("isActive") as BrandFiltersState["isActive"]) ?? "all",
    sort: (searchParams.get("sort") as BrandFiltersState["sort"]) ?? "sortOrder",
    order: (searchParams.get("order") as BrandFiltersState["order"]) ?? "asc",
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
