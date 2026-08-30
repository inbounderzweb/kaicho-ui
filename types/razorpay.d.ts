// Razorpay Checkout.js is loaded at runtime from checkout.razorpay.com
// (see lib/payments/loadRazorpayScript.ts) — it is not an npm package and
// ships no types, so this is a minimal hand-rolled declaration covering
// only the options this app actually passes. Matches the repo's existing
// no-SDK-types convention (the API DTOs in lib/api/* are hand-written too).

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  /** Public key id — NEXT_PUBLIC_RAZORPAY_KEY_ID, safe to expose. */
  key: string;
  /** Amount in the smallest currency unit (paise for INR). */
  amount: number;
  currency: string;
  /** The Razorpay order id returned by POST /checkout. */
  order_id: string;
  name?: string;
  description?: string;
  image?: string;
  handler?: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    /** Fired when the customer dismisses the modal without paying. */
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open(): void;
}

interface Window {
  Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
}
