import type { PublicOffer } from "../api/offer";

// DISPLAY-ONLY eligibility, used to badge product cards / the product page
// with a live offer. It mirrors the backend's rule (explicit inclusion,
// exclusions always win) over the already-expanded id lists the public API
// returns. It never decides what a customer pays: the cart and checkout both
// ask the server (POST /offers/evaluate, /checkout/preview).

export interface OfferProductRef {
  productId: string;
  categoryId?: string | null;
}

export function isOfferEligibleForProduct(offer: PublicOffer, product: OfferProductRef): boolean {
  const categoryId = product.categoryId ?? null;
  if (offer.excludedProductIds.includes(product.productId)) return false;
  if (categoryId && offer.excludedCategoryIds.includes(categoryId)) return false;
  if (offer.eligibleProductIds.includes(product.productId)) return true;
  return Boolean(categoryId && offer.eligibleCategoryIds.includes(categoryId));
}

export type OfferRole = "BUY" | "FREE";

/** Buy products are checked first; a free-only product is one the offer hands out but doesn't require buying. */
export function isOfferFreeProduct(offer: PublicOffer, product: OfferProductRef): boolean {
  const categoryId = product.categoryId ?? null;
  if (offer.type !== "BOGO") return false;
  if (!offer.freeProductIds?.includes(product.productId)) return false;
  if (offer.excludedProductIds.includes(product.productId)) return false;
  if (categoryId && offer.excludedCategoryIds.includes(categoryId)) return false;
  return true;
}

/** Which part this product plays in the offer, or null when the offer doesn't involve it. */
export function offerRoleForProduct(offer: PublicOffer, product: OfferProductRef): OfferRole | null {
  if (isOfferEligibleForProduct(offer, product)) return "BUY";
  if (isOfferFreeProduct(offer, product)) return "FREE";
  return null;
}

/** The title to show customers: the admin's own wording, with a generated fallback only if it is blank. */
export function offerTitle(offer: Pick<PublicOffer, "name" | "type" | "buyQuantity" | "discountPercent" | "discountAmount">): string {
  const title = offer.name?.trim();
  if (title) return title;
  if (offer.type === "PERCENTAGE") return `${offer.discountPercent ?? 0}% Off`;
  if (offer.type === "FIXED") return `Flat Rs. ${offer.discountAmount ?? 0} Off`;
  return offerBadgeLabel(offer);
}

/**
 * Rupees one unit costs less under a percentage / fixed offer. Mirrors the
 * server (per-unit paise, capped at the unit price) so the card shows exactly
 * what the cart takes off per unit. BOGO has no per-unit price cut → 0.
 */
export function offerUnitDiscount(
  offer: Pick<PublicOffer, "type" | "discountPercent" | "discountAmount">,
  unitPrice: number
): number {
  const paise = Math.round(unitPrice * 100);
  let off = 0;
  if (offer.type === "PERCENTAGE") off = Math.round((paise * (offer.discountPercent ?? 0)) / 100);
  else if (offer.type === "FIXED") off = Math.round((offer.discountAmount ?? 0) * 100);
  return Math.max(0, Math.min(paise, off)) / 100;
}

/** How generous an offer is for ONE product: roughly "% of the price you save". Used only to pick which badge to show. */
function offerRank(offer: PublicOffer, unitPrice?: number): number {
  if (offer.type === "PERCENTAGE") return offer.discountPercent ?? 0;
  if (offer.type === "FIXED") {
    const amount = offer.discountAmount ?? 0;
    return unitPrice && unitPrice > 0 ? Math.min(100, (amount / unitPrice) * 100) : amount;
  }
  return 100 / (offer.buyQuantity + 1);
}

export interface OfferMatch {
  offer: PublicOffer;
  role: OfferRole;
}

/**
 * The ONE offer to advertise on a product, and the part the product plays in
 * it. If several live offers involve the product the most generous one is
 * shown (ties: the oldest, so the badge is stable) — offers are never
 * combined; the cart applies a single offer too (the one saving the most).
 * Display-only: the server decides what is actually charged.
 */
export function findOfferMatchForProduct(
  offers: PublicOffer[] | undefined,
  product: OfferProductRef,
  unitPrice?: number
): OfferMatch | null {
  if (!offers?.length) return null;
  let best: OfferMatch | null = null;
  let bestRank = -1;
  for (const offer of offers) {
    const role = offerRoleForProduct(offer, product);
    if (!role) continue;
    const rank = offerRank(offer, unitPrice);
    if (rank > bestRank) {
      best = { offer, role };
      bestRank = rank;
    }
  }
  return best;
}

export function findOfferForProduct(
  offers: PublicOffer[] | undefined,
  product: OfferProductRef,
  unitPrice?: number
): PublicOffer | null {
  return findOfferMatchForProduct(offers, product, unitPrice)?.offer ?? null;
}

export function offerBadgeLabel(offer: Pick<PublicOffer, "buyQuantity">): string {
  return `Buy ${offer.buyQuantity} Get 1 Free`;
}

type ConditionOffer = Pick<
  PublicOffer,
  "buyQuantity" | "maxFreeUnitsPerOrder" | "minPaidUnitPrice" | "endsAt" | "allowCouponStacking"
> &
  Partial<Pick<PublicOffer, "type" | "mode" | "discountPercent" | "discountAmount" | "freeProductIds">>;

/** Plain-language terms shown next to the badge on the product page. */
export function offerConditions(offer: ConditionOffer): string[] {
  const lines: string[] = [];
  if (offer.type === "PERCENTAGE") {
    lines.push(`${offer.discountPercent ?? 0}% off every unit of the eligible products.`);
  } else if (offer.type === "FIXED") {
    lines.push(`Rs. ${offer.discountAmount ?? 0} off every unit of the eligible products (never more than the item costs).`);
  } else if (offer.mode === "BOGO_ROLES" || (offer.freeProductIds?.length && offer.mode !== "BOGO_POOL")) {
    lines.push(`Buy ${offer.buyQuantity}, get 1 of the free items below free.`);
    lines.push(`Up to ${offer.maxFreeUnitsPerOrder} free item${offer.maxFreeUnitsPerOrder === 1 ? "" : "s"} per order.`);
    if (offer.minPaidUnitPrice > 0) lines.push(`The item you buy must cost at least Rs. ${offer.minPaidUnitPrice}.`);
  } else {
    lines.push(`Buy ${offer.buyQuantity}, get 1 eligible item of the same or lower price free.`);
    lines.push(`Up to ${offer.maxFreeUnitsPerOrder} free item${offer.maxFreeUnitsPerOrder === 1 ? "" : "s"} per order.`);
    if (offer.minPaidUnitPrice > 0) lines.push(`The item you buy must cost at least Rs. ${offer.minPaidUnitPrice}.`);
  }
  if (!offer.allowCouponStacking) lines.push("Can't be combined with coupon codes.");
  if (offer.endsAt) {
    lines.push(
      `Ends ${new Date(offer.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`
    );
  }
  return lines;
}

/**
 * Label for the offer's line in a price summary / receipt. Buy X Get Y Free
 * keeps its familiar "Free item discount"; percentage and fixed-amount offers
 * use the admin's own title ("50% Off"). Works for the cart preview and for the
 * frozen order snapshot (orders placed before offer types existed have no
 * `type` and are treated as Buy X Get Y Free).
 */
export function offerSummaryLabel(
  offer: { type?: string | null; name?: string | null; freeUnits?: number | null } | null | undefined
): string {
  if (offer && offer.type && offer.type !== "BOGO") return offer.name?.trim() || "Offer discount";
  const units = offer?.freeUnits ?? 0;
  return `Free item discount${units > 1 ? ` (${units} items)` : ""}`;
}
