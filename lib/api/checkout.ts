import { apiFetch } from "./client";
import type { MrpDisplayMode } from "./product";
import type { Order, PaymentMethod } from "./order";

// Backed by kaicho-be's /api/checkout (requireAuth). The cart itself stays
// client-side (zustand + localStorage), so both endpoints take the cart
// lines in the request body — and both re-price and re-check stock against
// the DB server-side. Nothing here ever sends a client-side price; the
// preview response's numbers are the only ones displayed at checkout.

export interface PackSelectionInput {
  packId: string;
  count: number;
}

export interface CheckoutLineInput {
  productId: string;
  quantity: number;
  /** Present only for a confirmed pack line (see PackRecommendationModal) — checkout.service.ts re-derives quantity/price from this, never trusts a client price. */
  packSelection?: PackSelectionInput[];
}

export interface CheckoutPreviewPackLine {
  packId: string;
  packName: string;
  packQuantity: number;
  packCount: number;
  packPrice: number;
}

export interface CheckoutPreviewItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  mrp: number;
  discount: number;
  discountPercentage: number;
  mrpDisplay?: MrpDisplayMode;
  lineTotal: number;
  selectionType?: "UNIT" | "PACK";
  packBreakdown?: CheckoutPreviewPackLine[];
  /** Product no longer purchasable (deleted/inactive) — blocks checkout. */
  unavailable?: boolean;
  /** Fewer units in stock than requested — blocks checkout until adjusted. */
  insufficientStock?: boolean;
  /** How many units are actually available, when insufficientStock is set. */
  availableQuantity?: number;
  /** A stale/no-longer-valid pack selection — same treatment as `unavailable`. */
  packError?: string;
  /** BOGO: how many of `quantity` are FREE (0 when none). `lineTotal` stays the full pre-offer value. */
  freeQuantity?: number;
  /** BOGO: rupees taken off this line for its free units. */
  offerDiscount?: number;
}

export interface CheckoutPreviewPricing {
  subtotal: number;
  /** BOGO offer discount in rupees. 0 / absent when no offer applied. */
  offerDiscountTotal?: number;
  /** Coupon discount on the subtotal, in rupees. 0 when no coupon or a
   *  free-delivery coupon (whose benefit is a zeroed shippingFee). */
  discountTotal: number;
  shippingFee: number;
  taxTotal: number;
  grandTotal: number;
}

export interface CheckoutPreviewCoupon {
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED" | "FREE_DELIVERY";
  discountAmount: number;
  freeDelivery: boolean;
}

export type OfferRejectionReason =
  | "PRICE_TOO_HIGH"
  | "NOT_ENOUGH_PAID_ITEMS"
  | "LIMIT_REACHED"
  | "NOT_ELIGIBLE"
  | "NOT_IN_CART";

/** The server's verdict on the best live offer for this cart. */
export interface CheckoutPreviewOffer {
  id: string;
  /** The offer's customer-facing title. */
  name: string;
  type?: "BOGO" | "PERCENTAGE" | "FIXED";
  /** BOGO_POOL = the original "free item costs the same or less" rule; BOGO_ROLES = separate free products. */
  mode?: "PERCENTAGE" | "FIXED" | "BOGO_POOL" | "BOGO_ROLES";
  discountPercent?: number | null;
  /** FIXED offers: rupees off each unit. */
  discountAmountPerUnit?: number | null;
  description: string | null;
  buyQuantity: number;
  maxFreeUnitsPerOrder: number;
  minPaidUnitPrice: number;
  allowCouponStacking: boolean;
  /** False when the offer is live but nothing qualifies yet (e.g. "add 1 more"). */
  applied: boolean;
  /** Cart products this offer covers. */
  eligibleProductIds: string[];
  /** BOGO: products configured as free (empty on offers made before free products existed). */
  freeProductIds?: string[];
  /** BOGO: cart products the shopper may pick as their free item (falls back to eligibleProductIds). */
  freeCandidateProductIds?: string[];
  /** BOGO with a separate free list: none of the free products is in the cart yet. */
  needsFreeProduct?: boolean;
  /** Rupees taken off each product's whole line, any offer type. */
  discountByProduct?: Record<string, number>;
  discountAmount: number;
  freeUnits: number;
  limitReached: boolean;
  /** More eligible units needed before the next free one unlocks. */
  unitsToNextFree: number;
  freeByProduct: Record<string, number>;
  /** Free picks that were NOT honoured (they stay paid) and why. */
  rejected: { productId: string; quantity: number; reason: OfferRejectionReason; message: string }[];
}

export interface CheckoutPreviewResult {
  items: CheckoutPreviewItem[];
  pricing: CheckoutPreviewPricing;
  /** The applied coupon, or null when none was sent / it was rejected. */
  coupon: CheckoutPreviewCoupon | null;
  /** Why a sent coupon couldn't be applied — the cart is still priced
   *  without it so the page can render. */
  couponError: string | null;
  /** Best live BOGO offer for this cart, or null when none is relevant. */
  offer?: CheckoutPreviewOffer | null;
}

export interface PlaceOrderInput {
  items: CheckoutLineInput[];
  addressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  /** The shopper's preferred free units — re-validated server-side. */
  freeSelections?: { productId: string; quantity: number }[];
  /** The offer discount the shopper was SHOWN. Never used to price anything:
   *  if it no longer matches, the server answers 409 so they can re-review. */
  expectedOfferDiscount?: number;
}

/** Razorpay's own order handle, echoed back so Checkout.js can be opened
 *  with it. Absent for COD orders. */
export interface RazorpayOrderHandle {
  id: string;
  amount: number;
  currency: string;
}

export interface PlaceOrderResult {
  order: Order;
  razorpayOrder?: RazorpayOrderHandle;
}

export function previewCheckout(
  items: CheckoutLineInput[],
  couponCode?: string,
  freeSelections?: { productId: string; quantity: number }[]
): Promise<CheckoutPreviewResult> {
  return apiFetch<CheckoutPreviewResult>("/checkout/preview", {
    method: "POST",
    body: JSON.stringify({
      items,
      ...(couponCode ? { couponCode } : {}),
      // [] is meaningful: the shopper chose "no free items" (manual mode).
      ...(freeSelections ? { freeSelections } : {}),
    }),
  });
}

// The idempotency key is generated once per checkout session (see
// CheckoutClient) and reused across retries, so a double-submit or a
// retried network failure returns the already-created order instead of
// placing a second one / double-decrementing stock.
export function placeOrder(input: PlaceOrderInput, idempotencyKey: string): Promise<PlaceOrderResult> {
  return apiFetch<PlaceOrderResult>("/checkout", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(input),
  });
}
