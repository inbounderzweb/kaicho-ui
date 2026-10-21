import { describe, expect, it } from "vitest";
import type { PublicOffer } from "@/lib/api/offer";
import { findOfferForProduct, isOfferEligibleForProduct, offerBadgeLabel, offerConditions } from "../matching";

const offer = (over: Partial<PublicOffer> = {}): PublicOffer => ({
  id: "o1",
  name: "BOGO",
  description: null,
  image: null,
  type: "BOGO",
  buyQuantity: 1,
  maxFreeUnitsPerOrder: 2,
  minPaidUnitPrice: 0,
  allowCouponStacking: false,
  startsAt: null,
  endsAt: null,
  applyToAll: false,
  eligibleProductIds: [],
  eligibleCategoryIds: [],
  excludedProductIds: [],
  excludedCategoryIds: [],
  ...over,
});

describe("isOfferEligibleForProduct", () => {
  it("is explicit — an offer with no scope covers nothing", () => {
    expect(isOfferEligibleForProduct(offer(), { productId: "p1", categoryId: "c1" })).toBe(false);
  });

  it("matches an eligible product or category", () => {
    expect(isOfferEligibleForProduct(offer({ eligibleProductIds: ["p1"] }), { productId: "p1" })).toBe(true);
    expect(isOfferEligibleForProduct(offer({ eligibleCategoryIds: ["c1"] }), { productId: "p9", categoryId: "c1" })).toBe(true);
    expect(isOfferEligibleForProduct(offer({ eligibleCategoryIds: ["c1"] }), { productId: "p9", categoryId: "c2" })).toBe(false);
  });

  it("exclusions win over a category inclusion", () => {
    const o = offer({ eligibleCategoryIds: ["c1"], excludedProductIds: ["p1"], excludedCategoryIds: ["c9"] });
    expect(isOfferEligibleForProduct(o, { productId: "p2", categoryId: "c1" })).toBe(true);
    expect(isOfferEligibleForProduct(o, { productId: "p1", categoryId: "c1" })).toBe(false);
  });

  it("an excluded product beats an explicit inclusion", () => {
    const o = offer({ eligibleProductIds: ["p1"], excludedProductIds: ["p1"] });
    expect(isOfferEligibleForProduct(o, { productId: "p1" })).toBe(false);
  });
});

describe("findOfferForProduct / labels", () => {
  it("returns null with no offers and the first matching offer otherwise", () => {
    expect(findOfferForProduct(undefined, { productId: "p1" })).toBeNull();
    expect(findOfferForProduct([], { productId: "p1" })).toBeNull();
    const a = offer({ id: "a", eligibleProductIds: ["p1"] });
    const b = offer({ id: "b", eligibleProductIds: ["p2"] });
    expect(findOfferForProduct([a, b], { productId: "p1" })?.id).toBe("a");
    expect(findOfferForProduct([a, b], { productId: "p2" })?.id).toBe("b");
  });

  it("labels the badge from the purchase quantity", () => {
    expect(offerBadgeLabel({ buyQuantity: 1 })).toBe("Buy 1 Get 1 Free");
    expect(offerBadgeLabel({ buyQuantity: 2 })).toBe("Buy 2 Get 1 Free");
  });

  it("states the real conditions", () => {
    const lines = offerConditions(offer({ maxFreeUnitsPerOrder: 1, minPaidUnitPrice: 150, endsAt: "2030-01-15T00:00:00.000Z" }));
    expect(lines.join(" ")).toMatch(/same or lower price/);
    expect(lines.join(" ")).toMatch(/Up to 1 free item per order/);
    expect(lines.join(" ")).toMatch(/at least Rs\. 150/);
    expect(lines.join(" ")).toMatch(/Can't be combined with coupon codes/);
    expect(lines.join(" ")).toMatch(/Ends/);
  });
});
