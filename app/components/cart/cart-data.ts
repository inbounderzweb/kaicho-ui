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

/** Display-only pack breakdown snapshot — re-validated/re-priced server-side at checkout, never trusted. */
export interface CartPackBreakdownLine {
  packId: string;
  packName: string;
  packQuantity: number;
  packCount: number;
  packPrice: number;
}

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
  /** Absent (or "UNIT") for every cart line before this feature existed and for a plain quantity selection. */
  selectionType?: "UNIT" | "PACK";
  packBreakdown?: CartPackBreakdownLine[];
}

// A pack line and a plain unit line for the SAME product must be able to
// coexist in the cart (spec §14: "Individual x2" + "Pack of 5 x1" are two
// rows, not one merged row) — so cart identity is productId + this
// signature, not productId alone. Normalize pack counts to their ratio so
// repeated additions keep a stable identity while different mixes stay separate.
export function cartLineKey(item: Pick<CartItem, "productId" | "packBreakdown">): string {
  if (!item.packBreakdown || item.packBreakdown.length === 0) {
    return `${item.productId}:UNIT`;
  }
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const divisor = item.packBreakdown.reduce((value, line) => gcd(value, line.packCount), 0) || 1;
  const signature = [...item.packBreakdown]
    .sort((a, b) => a.packId.localeCompare(b.packId))
    .map((l) => `${l.packId}x${l.packCount / divisor}`)
    .join(",");
  return `${item.productId}:PACK:${signature}`;
}

export const INITIAL_CART: CartItem[] = [];
