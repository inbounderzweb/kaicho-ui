"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { InstagramPostStatusFilter } from "../../api/instagramPost";

export interface InstagramPostFiltersState {
  page: number;
  pageSize: number;
  search: string;
  status: InstagramPostStatusFilter;
}

type Patch = Partial<Record<keyof InstagramPostFiltersState, string | number | undefined>>;

// Same URL-state pattern as useCategoryFilters / useCouponFilters.
export function useInstagramPostFilters(): InstagramPostFiltersState & {
  update: (patch: Patch, resetPage?: boolean) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: InstagramPostFiltersState = {
    page: Number(searchParams.get("page") ?? "1") || 1,
    pageSize: Number(searchParams.get("pageSize") ?? "20") || 20,
    search: searchParams.get("search") ?? "",
    status: (searchParams.get("status") as InstagramPostStatusFilter) ?? "all",
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
