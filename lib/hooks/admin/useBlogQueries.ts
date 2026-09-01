"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { fetchAdminBlogs, fetchAdminBlogDetail, type AdminBlogQueryParams } from "../../api/blog";
import { blogKeys } from "../query-keys";

export function useBlogList(params: AdminBlogQueryParams = {}) {
  const {
    page = 1,
    pageSize = 20,
    status = "all",
    categoryId,
    author,
    tag,
    seoStatus = "all",
    search,
    dateFrom,
    dateTo,
    sort = "updated",
  } = params;

  const normalized: AdminBlogQueryParams = {
    page,
    pageSize,
    status,
    categoryId,
    author,
    tag,
    seoStatus,
    search,
    dateFrom,
    dateTo,
    sort,
  };

  return useQuery({
    queryKey: blogKeys.list(normalized),
    queryFn: () => fetchAdminBlogs(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useBlogDetail(id: string | null) {
  return useQuery({
    queryKey: blogKeys.detail(id ?? ""),
    queryFn: () => fetchAdminBlogDetail(id!),
    enabled: Boolean(id),
  });
}

export interface BlogFiltersState {
  page: number;
  pageSize: number;
  search: string;
  status: NonNullable<AdminBlogQueryParams["status"]>;
  categoryId: string;
  author: string;
  seoStatus: NonNullable<AdminBlogQueryParams["seoStatus"]>;
  dateFrom: string;
  dateTo: string;
  sort: NonNullable<AdminBlogQueryParams["sort"]>;
}

type Patch = Partial<Record<keyof BlogFiltersState, string | number | undefined>>;

// Same URL-state pattern as useCategoryFilters / useUsersFilters.
export function useBlogFilters(): BlogFiltersState & { update: (patch: Patch, resetPage?: boolean) => void } {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: BlogFiltersState = {
    page: Number(searchParams.get("page") ?? "1") || 1,
    pageSize: Number(searchParams.get("pageSize") ?? "20") || 20,
    search: searchParams.get("search") ?? "",
    status: (searchParams.get("status") as BlogFiltersState["status"]) ?? "all",
    categoryId: searchParams.get("categoryId") ?? "",
    author: searchParams.get("author") ?? "",
    seoStatus: (searchParams.get("seoStatus") as BlogFiltersState["seoStatus"]) ?? "all",
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
    sort: (searchParams.get("sort") as BlogFiltersState["sort"]) ?? "updated",
  };

  function update(patch: Patch, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "" || value === "all") params.delete(key);
      else params.set(key, String(value));
    }
    if (resetPage) params.delete("page");
    const qs = params.toString();
    router.replace((qs ? `${pathname}?${qs}` : pathname) as Parameters<typeof router.replace>[0], {
      scroll: false,
    });
  }

  return { ...state, update };
}
