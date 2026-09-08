import { useMutation } from "@tanstack/react-query";
import { previewCheckout, type CheckoutLineInput, type CheckoutPreviewResult } from "../api/checkout";

export interface CheckoutPreviewArgs {
  items: CheckoutLineInput[];
  /** Optional — the server prices the cart with the coupon when valid, and
   *  returns `couponError` (never throws) when it isn't. */
  couponCode?: string;
}

// Deliberately a mutation, not a query: the preview must reflect the cart
// exactly as it stands right now (prices and stock are re-read from the DB
// on every call), so it's triggered imperatively when the checkout page
// mounts and whenever the cart lines or the applied coupon change — never
// served from a cache that could show a customer a stale price at the moment
// they commit.
export function useCheckoutPreview() {
  return useMutation({
    mutationFn: ({ items, couponCode }: CheckoutPreviewArgs): Promise<CheckoutPreviewResult> =>
      previewCheckout(items, couponCode),
  });
}
