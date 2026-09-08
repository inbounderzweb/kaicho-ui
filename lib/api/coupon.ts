import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";

// Backed by kaicho-be:
//   POST /api/coupons/validate           (customer, requireAuth)
//   /api/admin/coupons/*                  (admin CRUD + status + usages)
// The backend recomputes every rupee — the client sends only a code (+ cart
// lines for validation) and renders what comes back.

export const COUPON_DISCOUNT_TYPES = ["PERCENTAGE", "FIXED", "FREE_DELIVERY"] as const;
export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];

export const COUPON_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;
export type CouponStatus = (typeof COUPON_STATUSES)[number];

export type EffectiveCouponStatus = CouponStatus | "EXPIRED" | "SCHEDULED";

// ---- Customer: validate ----

export interface ValidateCouponResult {
  valid: true;
  coupon: { code: string; name: string };
  discount: { type: CouponDiscountType; amount: number; freeDelivery: boolean };
  pricing: { subtotal: number; discount: number; delivery: number; total: number };
}

export interface CartLineInput {
  productId: string;
  quantity: number;
}

export function validateCoupon(code: string, items: CartLineInput[]): Promise<ValidateCouponResult> {
  return apiFetch<ValidateCouponResult>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, items }),
  });
}

// ---- Admin ----

export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderValue: number;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  status: CouponStatus;
  effectiveStatus: EffectiveCouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CouponActivityEntry {
  id: string;
  action: "CREATED" | "UPDATED" | "ACTIVATED" | "PAUSED" | "ARCHIVED";
  changes: { field: string; from: string; to: string }[];
  note: string | null;
  actor: string | null;
  at: string;
}

export interface AdminCouponDetail extends AdminCoupon {
  activity: CouponActivityEntry[];
}

export type CouponStatusFilter = "all" | EffectiveCouponStatus;

export interface CouponQueryParams extends PageParams {
  search?: string;
  status?: CouponStatusFilter;
  sort?: "createdAt" | "expiresAt" | "usedCount" | "code";
  order?: "asc" | "desc";
}

export interface CouponFormPayload {
  code: string;
  name: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderValue?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  status?: "DRAFT" | "ACTIVE" | "PAUSED";
}

export interface CouponUsageRow {
  id: string;
  customer: string;
  orderNumber: string;
  discountAmount: number;
  freeDelivery: boolean;
  usedAt: string;
}

export interface CouponUsageResult {
  couponCode: string;
  totalUsage: number;
  items: CouponUsageRow[];
  page: number;
  pageSize: number;
  total: number;
}

function query({ page = 1, pageSize = 20 }: PageParams): string {
  return `?page=${page}&pageSize=${pageSize}`;
}

export function fetchCoupons({
  search,
  status,
  sort,
  order,
  ...pageParams
}: CouponQueryParams = {}): Promise<Paginated<AdminCoupon>> {
  let qs = query(pageParams);
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") qs += `&status=${status}`;
  if (sort) qs += `&sort=${sort}`;
  if (order) qs += `&order=${order}`;
  return apiFetch<Paginated<AdminCoupon>>(`/admin/coupons${qs}`, { method: "GET" });
}

export function fetchCouponDetail(id: string): Promise<{ coupon: AdminCouponDetail }> {
  return apiFetch<{ coupon: AdminCouponDetail }>(`/admin/coupons/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function createCoupon(payload: CouponFormPayload): Promise<{ coupon: AdminCouponDetail }> {
  return apiFetch<{ coupon: AdminCouponDetail }>("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCoupon(
  id: string,
  patch: Partial<CouponFormPayload>
): Promise<{ coupon: AdminCouponDetail }> {
  return apiFetch<{ coupon: AdminCouponDetail }>(`/admin/coupons/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function setCouponStatus(
  id: string,
  status: "ACTIVE" | "PAUSED" | "ARCHIVED"
): Promise<{ coupon: AdminCouponDetail }> {
  return apiFetch<{ coupon: AdminCouponDetail }>(`/admin/coupons/${encodeURIComponent(id)}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export function fetchCouponUsages(
  id: string,
  { page = 1, pageSize = 20 }: PageParams = {}
): Promise<CouponUsageResult> {
  return apiFetch<CouponUsageResult>(
    `/admin/coupons/${encodeURIComponent(id)}/usages?page=${page}&pageSize=${pageSize}`,
    { method: "GET" }
  );
}
