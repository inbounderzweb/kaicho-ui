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

/** The offer to advertise on a product. Oldest first so the badge is stable. */
export function findOfferForProduct(offers: PublicOffer[] | undefined, product: OfferProductRef): PublicOffer | null {
  if (!offers?.length) return null;
  return offers.find((o) => isOfferEligibleForProduct(o, product)) ?? null;
}

export function offerBadgeLabel(offer: Pick<PublicOffer, "buyQuantity">): string {
  return `Buy ${offer.buyQuantity} Get 1 Free`;
}

/** Plain-language terms shown next to the badge on the product page. */
export function offerConditions(
  offer: Pick<PublicOffer, "buyQuantity" | "maxFreeUnitsPerOrder" | "minPaidUnitPrice" | "endsAt" | "allowCouponStacking">
): string[] {
  const lines = [
    `Buy ${offer.buyQuantity}, get 1 eligible item of the same or lower price free.`,
    `Up to ${offer.maxFreeUnitsPerOrder} free item${offer.maxFreeUnitsPerOrder === 1 ? "" : "s"} per order.`,
  ];
  if (offer.minPaidUnitPrice > 0) lines.push(`The item you buy must cost at least Rs. ${offer.minPaidUnitPrice}.`);
  if (!offer.allowCouponStacking) lines.push("Can't be combined with coupon codes.");
  if (offer.endsAt) {
    lines.push(
      `Ends ${new Date(offer.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`
    );
  }
  return lines;
}
