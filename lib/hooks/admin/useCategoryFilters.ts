"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { CategoryQueryParams } from "../../api/category";

export interface CategoryFiltersState {
  page: number;
  pageSize: number;
  search: string;
  parentId: string;
  isActive: NonNullable<CategoryQueryParams["isActive"]>;
  sort: NonNullable<CategoryQueryParams["sort"]>;
  order: NonNullable<CategoryQueryParams["order"]>;
}

type Patch = Partial<Record<keyof CategoryFiltersState, string | number | undefined>>;

// Same URL-state pattern as useUsersFilters/useMediaFilters.
export function useCategoryFilters(): CategoryFiltersState & {
  update: (patch: Patch, resetPage?: boolean) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: CategoryFiltersState = {
    page: Number(searchParams.get("page") ?? "1") || 1,
    pageSize: Number(searchParams.get("pageSize") ?? "20") || 20,
    search: searchParams.get("search") ?? "",
    parentId: searchParams.get("parentId") ?? "",
    isActive: (searchParams.get("isActive") as CategoryFiltersState["isActive"]) ?? "all",
    sort: (searchParams.get("sort") as CategoryFiltersState["sort"]) ?? "sortOrder",
    order: (searchParams.get("order") as CategoryFiltersState["order"]) ?? "asc",
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
