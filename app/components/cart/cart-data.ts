import { DEFAULT_STORE_SETTINGS } from "@/lib/api/settings";

// Previously seeded from the dummy MEALS/COMBOS marketing data
// (app/components/sections/product-data.ts) with a hardcoded 3-item
// INITIAL_CART. Now backed by real products: CartItem stores a productId
// (the source of truth to re-verify against at checkout time — this app
// has no backend Cart/Order module yet, so the cart itself stays the
// existing client-side/persisted zustand store per the spec's "reuse the
// existing cart module" instruction) plus a display-only price/image
// snapshot taken when the item was added. That snapshot is never sent
// anywhere as an authoritative price: checkout sends only
// {productId, quantity} to POST /checkout/preview and POST /checkout, both
// of which re-read price, discount and stock from the DB — the numbers
// shown on the checkout page come from those responses, never from here.

// Free-delivery threshold and flat fee are admin-configurable (Admin →
// Settings, persisted in StoreSettings, served at GET /settings). These
// constants are only the fallback the storefront renders with until that
// fetch resolves — components should read the live values via
// useShippingPolicy(). CASHBACK_* stay storefront-only display values.
export const FREE_SHIPPING_THRESHOLD = DEFAULT_STORE_SETTINGS.freeShippingThreshold;
export const FLAT_SHIPPING_FEE = DEFAULT_STORE_SETTINGS.flatShippingFee;
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
