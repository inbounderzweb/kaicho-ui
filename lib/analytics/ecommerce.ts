import type { EcommerceItem } from "./types";

/**
 * Convenience builder for the future cart/checkout/product features to call
 * when constructing `trackEvent` params — not wired to any UI yet (there is
 * no cart/product-detail route in this repo). Pure/typed, not a mock
 * service: safe to keep even though it's currently unused by the app.
 */
export function toEcommerceItem(input: {
  id: string;
  name: string;
  price: number;
  currency?: string;
  quantity?: number;
  category?: string;
}): EcommerceItem {
  return {
    item_id: input.id,
    item_name: input.name,
    price: input.price,
    currency: input.currency ?? "INR",
    quantity: input.quantity,
    item_category: input.category,
  };
}
