"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  fetchInquiries,
  fetchInquiryDetail,
  fetchInquiryStats,
  fetchInquiryAssignees,
  type AdminInquiryQueryParams,
} from "../../api/inquiry";
import { inquiryKeys } from "../query-keys";

export function useInquiryList(params: AdminInquiryQueryParams = {}) {
  const {
    page = 1,
    pageSize = 20,
    formType = "all",
    status = "all",
    assignedTo,
    search,
    dateFrom,
    dateTo,
    sort = "newest",
  } = params;

  const normalized: AdminInquiryQueryParams = {
    page,
    pageSize,
    formType,
    status,
    assignedTo,
    search,
    dateFrom,
    dateTo,
    sort,
  };

  return useQuery({
    queryKey: inquiryKeys.list(normalized),
    queryFn: () => fetchInquiries(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useInquiryDetail(id: string | null) {
  return useQuery({
    queryKey: inquiryKeys.detail(id ?? ""),
    queryFn: () => fetchInquiryDetail(id!),
    enabled: Boolean(id),
  });
}

export function useInquiryStats() {
  return useQuery({
    queryKey: inquiryKeys.stats,
    queryFn: fetchInquiryStats,
    staleTime: 30_000,
  });
}

export function useInquiryAssignees() {
  return useQuery({
    queryKey: inquiryKeys.assignees,
    queryFn: fetchInquiryAssignees,
    staleTime: 5 * 60_000,
  });
}

export interface InquiryFiltersState {
  page: number;
  pageSize: number;
  search: string;
  formType: NonNullable<AdminInquiryQueryParams["formType"]>;
  status: NonNullable<AdminInquiryQueryParams["status"]>;
  assignedTo: string;
  dateFrom: string;
  dateTo: string;
  sort: NonNullable<AdminInquiryQueryParams["sort"]>;
}

type Patch = Partial<Record<keyof InquiryFiltersState, string | number | undefined>>;

// Same URL-state pattern as useBlogFilters / useCategoryFilters.
export function useInquiryFilters(): InquiryFiltersState & {
  update: (patch: Patch, resetPage?: boolean) => void;
  clear: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: InquiryFiltersState = {
    page: Number(searchParams.get("page") ?? "1") || 1,
    pageSize: Number(searchParams.get("pageSize") ?? "20") || 20,
    search: searchParams.get("search") ?? "",
    formType: (searchParams.get("formType") as InquiryFiltersState["formType"]) ?? "all",
    status: (searchParams.get("status") as InquiryFiltersState["status"]) ?? "all",
    assignedTo: searchParams.get("assignedTo") ?? "",
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
    sort: (searchParams.get("sort") as InquiryFiltersState["sort"]) ?? "newest",
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

  function clear() {
    router.replace(pathname as Parameters<typeof router.replace>[0], { scroll: false });
  }

  return { ...state, update, clear };
}
