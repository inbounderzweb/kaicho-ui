import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCoupons,
  fetchCouponDetail,
  fetchCouponUsages,
  createCoupon,
  updateCoupon,
  setCouponStatus,
  type CouponQueryParams,
  type CouponFormPayload,
} from "../../api/coupon";
import { couponKeys } from "../query-keys";

export function useCouponList(params: CouponQueryParams = {}) {
  const {
    page = 1,
    pageSize = 20,
    search,
    status = "all",
    sort = "createdAt",
    order = "desc",
  } = params;
  const normalized: CouponQueryParams = { page, pageSize, search, status, sort, order };

  return useQuery({
    queryKey: couponKeys.list(normalized),
    queryFn: () => fetchCoupons(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCouponDetail(id: string | null) {
  return useQuery({
    queryKey: couponKeys.detail(id ?? "new"),
    queryFn: () => fetchCouponDetail(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useCouponUsages(id: string, page: number, pageSize: number) {
  return useQuery({
    queryKey: couponKeys.usages(id, page, pageSize),
    queryFn: () => fetchCouponUsages(id, { page, pageSize }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateCoupons() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
}

export function useCreateCoupon() {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: (payload: CouponFormPayload) => createCoupon(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateCoupon(id: string) {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: (patch: Partial<CouponFormPayload>) => updateCoupon(id, patch),
    onSuccess: invalidate,
  });
}

export function useSetCouponStatus(id: string) {
  const invalidate = useInvalidateCoupons();
  return useMutation({
    mutationFn: (status: "ACTIVE" | "PAUSED" | "ARCHIVED") => setCouponStatus(id, status),
    onSuccess: invalidate,
  });
}
