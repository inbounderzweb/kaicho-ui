import { apiFetch } from "./client";
import type { Order, PaymentMethod } from "./order";

// Backed by kaicho-be's /api/checkout (requireAuth). The cart itself stays
// client-side (zustand + localStorage), so both endpoints take the cart
// lines in the request body — and both re-price and re-check stock against
// the DB server-side. Nothing here ever sends a client-side price; the
// preview response's numbers are the only ones displayed at checkout.

export interface CheckoutLineInput {
  productId: string;
  quantity: number;
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
  lineTotal: number;
  /** Product no longer purchasable (deleted/inactive) — blocks checkout. */
  unavailable?: boolean;
  /** Fewer units in stock than requested — blocks checkout until adjusted. */
  insufficientStock?: boolean;
  /** How many units are actually available, when insufficientStock is set. */
  availableQuantity?: number;
}

export interface CheckoutPreviewPricing {
  subtotal: number;
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

export interface CheckoutPreviewResult {
  items: CheckoutPreviewItem[];
  pricing: CheckoutPreviewPricing;
  /** The applied coupon, or null when none was sent / it was rejected. */
  coupon: CheckoutPreviewCoupon | null;
  /** Why a sent coupon couldn't be applied — the cart is still priced
   *  without it so the page can render. */
  couponError: string | null;
}

export interface PlaceOrderInput {
  items: CheckoutLineInput[];
  addressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
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
  couponCode?: string
): Promise<CheckoutPreviewResult> {
  return apiFetch<CheckoutPreviewResult>("/checkout/preview", {
    method: "POST",
    body: JSON.stringify(couponCode ? { items, couponCode } : { items }),
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
