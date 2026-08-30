import { apiFetch } from "./client";
import type { Order } from "./order";

// Backed by kaicho-be's /api/payments (requireAuth). Only the verify call
// lives here — the Razorpay webhook is server-to-server and never touched
// from the browser.

export interface VerifyPaymentInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// The signature is verified server-side against the Razorpay key secret;
// a successful response is the only thing that marks an order PAID. The
// client calling this is a convenience path (the webhook is the
// authoritative one), so a failure here is not proof the payment failed.
export function verifyRazorpayPayment(input: VerifyPaymentInput): Promise<{ order: Order }> {
  return apiFetch<{ order: Order }>("/payments/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
