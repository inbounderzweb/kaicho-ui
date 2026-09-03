"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { MediaQueryParams } from "../../api/media";

export interface MediaFiltersState {
  page: number;
  pageSize: number;
  search: string;
  status: NonNullable<MediaQueryParams["status"]>;
  mediaType: NonNullable<MediaQueryParams["mediaType"]>;
  minWidth?: number;
  minHeight?: number;
  sort: NonNullable<MediaQueryParams["sort"]>;
  order: NonNullable<MediaQueryParams["order"]>;
}

type Patch = Partial<Record<keyof MediaFiltersState, string | number | undefined>>;

// Same URL-state pattern as useUsersFilters — keeps the media library's
// search/filters/sort/pagination shareable and refresh-safe.
export function useMediaFilters(): MediaFiltersState & { update: (patch: Patch, resetPage?: boolean) => void } {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: MediaFiltersState = {
    page: Number(searchParams.get("page") ?? "1") || 1,
    pageSize: Number(searchParams.get("pageSize") ?? "24") || 24,
    search: searchParams.get("search") ?? "",
    status: (searchParams.get("status") as MediaFiltersState["status"]) ?? "all",
    mediaType: (searchParams.get("mediaType") as MediaFiltersState["mediaType"]) ?? "all",
    minWidth: Number(searchParams.get("minWidth")) || undefined,
    minHeight: Number(searchParams.get("minHeight")) || undefined,
    sort: (searchParams.get("sort") as MediaFiltersState["sort"]) ?? "createdAt",
    order: (searchParams.get("order") as MediaFiltersState["order"]) ?? "desc",
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
