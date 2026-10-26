import { describe, expect, it } from "vitest";
import type { PublicOffer } from "@/lib/api/offer";
import {
  findOfferForProduct,
  findOfferMatchForProduct,
  isOfferEligibleForProduct,
  offerBadgeLabel,
  offerConditions,
  offerRoleForProduct,
  offerSummaryLabel,
  offerTitle,
  offerUnitDiscount,
} from "../matching";

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

describe("offer titles", () => {
  it("shows the admin's own title, and only falls back to a generated one when it is blank", () => {
    expect(offerTitle(offer({ name: "Diwali Special" }))).toBe("Diwali Special");
    expect(offerTitle(offer({ name: "  ", buyQuantity: 2 }))).toBe("Buy 2 Get 1 Free");
    expect(offerTitle(offer({ name: "", type: "PERCENTAGE", discountPercent: 50 }))).toBe("50% Off");
    expect(offerTitle(offer({ name: "", type: "FIXED", discountAmount: 100 }))).toBe("Flat Rs. 100 Off");
  });
});

describe("buy / free roles", () => {
  const roles = offer({
    type: "BOGO",
    mode: "BOGO_ROLES",
    eligibleProductIds: ["nav"],
    freeProductIds: ["chk"],
    excludedProductIds: ["blocked"],
  });

  it("tells a product to buy from a free product, and ignores everything else", () => {
    expect(offerRoleForProduct(roles, { productId: "nav" })).toBe("BUY");
    expect(offerRoleForProduct(roles, { productId: "chk" })).toBe("FREE");
    expect(offerRoleForProduct(roles, { productId: "other" })).toBeNull();
  });

  it("an excluded product can't be a free product", () => {
    const o = offer({ ...roles, freeProductIds: ["blocked"] });
    expect(offerRoleForProduct(o, { productId: "blocked" })).toBeNull();
  });

  it("only Buy X Get Y Free offers have free products", () => {
    const o = offer({ type: "PERCENTAGE", discountPercent: 10, eligibleProductIds: ["a"], freeProductIds: ["z"] });
    expect(offerRoleForProduct(o, { productId: "z" })).toBeNull();
  });

  it("a product on both lists counts as the one to buy", () => {
    const o = offer({ eligibleProductIds: ["a"], freeProductIds: ["a"] });
    expect(offerRoleForProduct(o, { productId: "a" })).toBe("BUY");
  });
});

describe("percentage / fixed prices match the server", () => {
  it("per-unit discount, capped at the price", () => {
    expect(offerUnitDiscount({ type: "PERCENTAGE", discountPercent: 50, discountAmount: null }, 199)).toBe(99.5);
    expect(offerUnitDiscount({ type: "PERCENTAGE", discountPercent: 100, discountAmount: null }, 199)).toBe(199);
    expect(offerUnitDiscount({ type: "FIXED", discountPercent: null, discountAmount: 100 }, 300)).toBe(100);
    expect(offerUnitDiscount({ type: "FIXED", discountPercent: null, discountAmount: 100 }, 60)).toBe(60);
    expect(offerUnitDiscount({ type: "BOGO" }, 300)).toBe(0);
  });
});

describe("which offer a product advertises", () => {
  it("shows the most generous one — offers are never combined", () => {
    const ten = offer({ id: "ten", type: "PERCENTAGE", discountPercent: 10, eligibleProductIds: ["p1"] });
    const fifty = offer({ id: "fifty", type: "PERCENTAGE", discountPercent: 50, eligibleProductIds: ["p1"] });
    const bogo = offer({ id: "bogo", eligibleProductIds: ["p1"], buyQuantity: 1 }); // 50% effective
    expect(findOfferForProduct([ten, fifty], { productId: "p1" })?.id).toBe("fifty");
    // Equal generosity: the oldest (first) offer keeps the badge.
    expect(findOfferForProduct([bogo, fifty], { productId: "p1" })?.id).toBe("bogo");
    expect(findOfferForProduct([fifty, bogo], { productId: "p1" })?.id).toBe("fifty");
  });

  it("weighs a fixed amount against the product's price", () => {
    const flat = offer({ id: "flat", type: "FIXED", discountAmount: 100, eligibleProductIds: ["p1"] });
    const pct = offer({ id: "pct", type: "PERCENTAGE", discountPercent: 20, eligibleProductIds: ["p1"] });
    expect(findOfferForProduct([flat, pct], { productId: "p1" }, 200)?.id).toBe("flat"); // 50% > 20%
    expect(findOfferForProduct([flat, pct], { productId: "p1" }, 1000)?.id).toBe("pct"); // 10% < 20%
  });

  it("reports the role alongside the offer, and nothing for an unrelated product", () => {
    const o = offer({ eligibleProductIds: ["nav"], freeProductIds: ["chk"], mode: "BOGO_ROLES" });
    expect(findOfferMatchForProduct([o], { productId: "chk" })).toMatchObject({ role: "FREE" });
    expect(findOfferMatchForProduct([o], { productId: "nope" })).toBeNull();
  });
});

describe("conditions per offer type", () => {
  it("percentage and fixed offers describe the discount, not a free item", () => {
    const pct = offerConditions(offer({ type: "PERCENTAGE", discountPercent: 50 })).join(" ");
    expect(pct).toMatch(/50% off every unit/);
    expect(pct).not.toMatch(/free/i);
    const fixed = offerConditions(offer({ type: "FIXED", discountAmount: 100 })).join(" ");
    expect(fixed).toMatch(/Rs\. 100 off every unit/);
  });

  it("a separate free product isn't held to the price of what was bought", () => {
    const lines = offerConditions(offer({ type: "BOGO", mode: "BOGO_ROLES", freeProductIds: ["c"] })).join(" ");
    expect(lines).toMatch(/free items below/);
    expect(lines).not.toMatch(/same or lower price/);
  });
});

describe("offerSummaryLabel", () => {
  it("keeps 'Free item discount' for Buy X Get Y Free, and old orders with no type", () => {
    expect(offerSummaryLabel({ type: "BOGO", freeUnits: 1 })).toBe("Free item discount");
    expect(offerSummaryLabel({ type: "BOGO", freeUnits: 3 })).toBe("Free item discount (3 items)");
    expect(offerSummaryLabel({ freeUnits: 2 })).toBe("Free item discount (2 items)");
    expect(offerSummaryLabel(null)).toBe("Free item discount");
  });

  it("uses the offer title for percentage and fixed offers", () => {
    expect(offerSummaryLabel({ type: "PERCENTAGE", name: "50% Off", freeUnits: 0 })).toBe("50% Off");
    expect(offerSummaryLabel({ type: "FIXED", name: " ", freeUnits: 0 })).toBe("Offer discount");
  });
});
