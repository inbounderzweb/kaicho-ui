"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { UsersRoleFilter, UsersSortField, UsersStatusFilter, SortOrder } from "../../api/admin";

export interface UsersFiltersState {
  page: number;
  pageSize: number;
  search: string;
  status: UsersStatusFilter;
  role: UsersRoleFilter;
  dateFrom?: string;
  dateTo?: string;
  sortBy: UsersSortField;
  sortOrder: SortOrder;
}

type Patch = Partial<Record<keyof UsersFiltersState, string | number | undefined>>;

/**
 * Keeps search/filters/sort/pagination in the URL (?search=&status=&...) so
 * the admin's exact view is refreshable, shareable, and back/forward-
 * navigable — spec-requested URL state, built on Next's own searchParams
 * rather than a separate client state store.
 */
export function useUsersFilters(): UsersFiltersState & { update: (patch: Patch, resetPage?: boolean) => void } {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: UsersFiltersState = {
    page: Number(searchParams.get("page") ?? "1") || 1,
    pageSize: Number(searchParams.get("pageSize") ?? "20") || 20,
    search: searchParams.get("search") ?? "",
    status: (searchParams.get("status") as UsersStatusFilter) ?? "all",
    role: (searchParams.get("role") as UsersRoleFilter) ?? "all",
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    sortBy: (searchParams.get("sortBy") as UsersSortField) ?? "createdAt",
    sortOrder: (searchParams.get("sortOrder") as SortOrder) ?? "desc",
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
