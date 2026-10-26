import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";
import type { CheckoutLineInput, CheckoutPreviewResult } from "./checkout";

// Backed by kaicho-be:
//   GET  /api/offers/active            (public — live offers, DISPLAY data only)
//   POST /api/offers/evaluate          (public — server-side cart pricing with the offer)
//   /api/admin/offers/*                (admin CRUD + status + simulate + usages)
// The backend decides every rupee. The client never sends a price, discount
// or eligibility flag — only product ids, quantities and the shopper's
// preferred free picks (which the server re-validates).

export const OFFER_STATUSES = ["DRAFT", "SCHEDULED", "ACTIVE", "EXPIRED", "DISABLED"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

/** BOGO = "Buy X Get Y Free" (the value existing offers already use). */
export const OFFER_TYPES = ["BOGO", "PERCENTAGE", "FIXED"] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  BOGO: "Buy X Get Y Free",
  PERCENTAGE: "Percentage discount",
  FIXED: "Fixed amount discount",
};

// ---- Storefront ----

export interface PublicOffer {
  id: string;
  name: string;
  description: string | null;
  image: { mediaId: string; url: string; thumbnailUrl?: string } | null;
  type: OfferType;
  /** How the server evaluates it. BOGO_POOL = the original "free item costs the same or less" rule. */
  mode?: "PERCENTAGE" | "FIXED" | "BOGO_POOL" | "BOGO_ROLES";
  discountPercent?: number | null;
  /** FIXED offers: rupees off each unit. */
  discountAmount?: number | null;
  buyQuantity: number;
  maxFreeUnitsPerOrder: number;
  minPaidUnitPrice: number;
  allowCouponStacking: boolean;
  startsAt: string | null;
  endsAt: string | null;
  applyToAll: boolean;
  eligibleProductIds: string[];
  /** BOGO with a separate free list. Empty on offers made before free products existed. */
  freeProductIds?: string[];
  /** Names for the products this offer mentions, keyed by product id. */
  productNames?: Record<string, { name: string; slug: string }>;
  /** Already expanded to include sub-categories. */
  eligibleCategoryIds: string[];
  excludedProductIds: string[];
  excludedCategoryIds: string[];
}

export function fetchActiveOffers(): Promise<{ offers: PublicOffer[] }> {
  return apiFetch<{ offers: PublicOffer[] }>("/offers/active", { method: "GET" });
}

export interface FreeSelectionInput {
  productId: string;
  quantity: number;
}

export function evaluateCartOffers(
  items: CheckoutLineInput[],
  freeSelections?: FreeSelectionInput[]
): Promise<CheckoutPreviewResult> {
  return apiFetch<CheckoutPreviewResult>("/offers/evaluate", {
    method: "POST",
    body: JSON.stringify(freeSelections ? { items, freeSelections } : { items }),
  });
}

// ---- Admin ----

export interface AdminOffer {
  id: string;
  /** The offer's customer-facing title. */
  name: string;
  type: OfferType;
  discountPercent?: number | null;
  discountAmount?: number | null;
  freeProductCount?: number;
  buyQuantity: number;
  maxFreeUnitsPerOrder: number;
  minPaidUnitPrice: number;
  allowCouponStacking: boolean;
  applyToAll: boolean;
  eligibleProductCount: number;
  eligibleCategoryCount: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  status: "DRAFT" | "ACTIVE" | "DISABLED";
  effectiveStatus: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OfferProductRef {
  id: string;
  name: string;
  sku: string | null;
  sellingPrice: number | null;
  status: string | null;
  imageUrl?: string | null;
}

export interface OfferCategoryRef {
  id: string;
  name: string;
}

export interface OfferActivityEntry {
  id: string;
  action: "CREATED" | "UPDATED" | "ACTIVATED" | "DISABLED";
  changes: { field: string; from: string; to: string }[];
  note: string | null;
  actor: string | null;
  at: string;
}

export interface AdminOfferDetail extends AdminOffer {
  description: string | null;
  image: { mediaId: string; url: string; thumbnailUrl?: string } | null;
  eligibleProducts: OfferProductRef[];
  freeProducts?: OfferProductRef[];
  eligibleCategories: OfferCategoryRef[];
  excludedProducts: OfferProductRef[];
  excludedCategories: OfferCategoryRef[];
  stats: { orders: number; freeUnits: number; totalDiscount: number };
  activity: OfferActivityEntry[];
}

export type OfferStatusFilter = "all" | OfferStatus;

export interface OfferQueryParams extends PageParams {
  search?: string;
  status?: OfferStatusFilter;
  sort?: "createdAt" | "endsAt" | "usedCount" | "name";
  order?: "asc" | "desc";
}

export interface OfferFormPayload {
  name: string;
  description?: string;
  type: OfferType;
  freeProductIds?: string[];
  discountPercent?: number | null;
  discountAmount?: number | null;
  imageMediaId?: string | null;
  applyToAll: boolean;
  eligibleProductIds: string[];
  eligibleCategoryIds: string[];
  excludedProductIds: string[];
  excludedCategoryIds: string[];
  buyQuantity: number;
  maxFreeUnitsPerOrder: number;
  minPaidUnitPrice: number;
  allowCouponStacking: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  status?: "DRAFT" | "SCHEDULED" | "ACTIVE" | "DISABLED";
}

export interface OfferUsageRow {
  id: string;
  customer: string;
  orderNumber: string;
  freeUnits: number;
  discountAmount: number;
  usedAt: string;
}

export interface OfferUsageResult {
  offerName: string;
  totalUsage: number;
  items: OfferUsageRow[];
  page: number;
  pageSize: number;
  total: number;
}

export interface OfferSimulationResult {
  type?: OfferType;
  discountAmount: number;
  freeUnits: number;
  limitReached: boolean;
  unitsToNextFree: number;
  needsFreeProduct?: boolean;
  lines: {
    productId: string;
    name: string | null;
    unitPrice: number;
    quantity: number;
    freeQuantity: number;
    paidQuantity: number;
    /** Rupees off this whole line (any offer type). */
    discountAmount?: number;
    /** BOGO: this product can be handed out free. */
    canBeFree?: boolean;
  }[];
  rejected: { productId: string; quantity: number; reason: string; message: string }[];
  skipped: { productId: string; reason: string }[];
}

export function fetchOffers({
  search,
  status,
  sort,
  order,
  page = 1,
  pageSize = 20,
}: OfferQueryParams = {}): Promise<Paginated<AdminOffer>> {
  let qs = `?page=${page}&pageSize=${pageSize}`;
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") qs += `&status=${status}`;
  if (sort) qs += `&sort=${sort}`;
  if (order) qs += `&order=${order}`;
  return apiFetch<Paginated<AdminOffer>>(`/admin/offers${qs}`, { method: "GET" });
}

export function fetchOfferDetail(id: string): Promise<{ offer: AdminOfferDetail }> {
  return apiFetch<{ offer: AdminOfferDetail }>(`/admin/offers/${encodeURIComponent(id)}`, { method: "GET" });
}

export function createOffer(payload: OfferFormPayload): Promise<{ offer: AdminOfferDetail }> {
  return apiFetch<{ offer: AdminOfferDetail }>("/admin/offers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOffer(
  id: string,
  patch: Partial<OfferFormPayload>
): Promise<{ offer: AdminOfferDetail }> {
  return apiFetch<{ offer: AdminOfferDetail }>(`/admin/offers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function setOfferStatus(
  id: string,
  status: "ACTIVE" | "DISABLED"
): Promise<{ offer: AdminOfferDetail }> {
  return apiFetch<{ offer: AdminOfferDetail }>(`/admin/offers/${encodeURIComponent(id)}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export function deleteOffer(id: string): Promise<null> {
  return apiFetch<null>(`/admin/offers/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function simulateOffer(
  id: string,
  items: { productId: string; quantity: number }[],
  freeSelections?: FreeSelectionInput[]
): Promise<OfferSimulationResult> {
  return apiFetch<OfferSimulationResult>(`/admin/offers/${encodeURIComponent(id)}/simulate`, {
    method: "POST",
    body: JSON.stringify(freeSelections ? { items, freeSelections } : { items }),
  });
}

export function fetchOfferUsages(
  id: string,
  { page = 1, pageSize = 20 }: PageParams = {}
): Promise<OfferUsageResult> {
  return apiFetch<OfferUsageResult>(
    `/admin/offers/${encodeURIComponent(id)}/usages?page=${page}&pageSize=${pageSize}`,
    { method: "GET" }
  );
}
