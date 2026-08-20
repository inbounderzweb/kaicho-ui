// Previously seeded from the dummy MEALS/COMBOS marketing data
// (app/components/sections/product-data.ts) with a hardcoded 3-item
// INITIAL_CART. Now backed by real products: CartItem stores a productId
// (the source of truth to re-verify against at checkout time — this app
// has no backend Cart/Order module yet, so the cart itself stays the
// existing client-side/persisted zustand store per the spec's "reuse the
// existing cart module" instruction) plus a display-only price/image
// snapshot taken when the item was added. That snapshot is never sent
// anywhere as an authoritative price — there is no checkout submission
// endpoint yet (see CartPageClient's disabled "Checkout coming soon"
// button), and when one is built it must re-fetch each product's current
// price/stock server-side rather than trust this snapshot.

export const FREE_SHIPPING_THRESHOLD = 499;
export const CASHBACK_THRESHOLD = 999;
export const CASHBACK_PERCENT = 3;

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  /** Absolute, resolved image URL (thumbnail-sized) — null if the product has no image. */
  image: string | null;
  imageAlt: string;
  /** Display-only price snapshot at add-to-cart time — not authoritative. */
  price: number;
  mrp: number;
  quantity: number;
  /** Stock snapshot at add-to-cart time — informational cap on the quantity stepper, re-verified server-side at checkout. */
  maxQuantity?: number;
}

export const INITIAL_CART: CartItem[] = [];
