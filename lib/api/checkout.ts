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
  shippingFee: number;
  taxTotal: number;
  grandTotal: number;
}

export interface CheckoutPreviewResult {
  items: CheckoutPreviewItem[];
  pricing: CheckoutPreviewPricing;
}

export interface PlaceOrderInput {
  items: CheckoutLineInput[];
  addressId: string;
  paymentMethod: PaymentMethod;
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

export function previewCheckout(items: CheckoutLineInput[]): Promise<CheckoutPreviewResult> {
  return apiFetch<CheckoutPreviewResult>("/checkout/preview", {
    method: "POST",
    body: JSON.stringify({ items }),
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
