import { describe, expect, it } from "vitest";
import { offerFormSchema } from "../offer.schema";

const valid = {
  name: "BOGO pickles",
  description: "",
  type: "BOGO" as const,
  applyToAll: false,
  buyQuantity: "1",
  maxFreeUnitsPerOrder: "2",
  minPaidUnitPrice: "",
  discountPercent: "",
  discountAmount: "",
  allowCouponStacking: false,
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  usageLimitPerUser: "",
  status: "DRAFT" as const,
};

describe("offerFormSchema", () => {
  it("accepts the defaults and coerces numeric strings", () => {
    const parsed = offerFormSchema.parse(valid);
    expect(parsed.buyQuantity).toBe(1);
    expect(parsed.maxFreeUnitsPerOrder).toBe(2);
    expect(parsed.minPaidUnitPrice).toBeUndefined(); // blank = no minimum; the form sends 0
    expect(parsed.usageLimit).toBeUndefined();
  });

  it("requires a name and a free-unit cap of at least 1", () => {
    expect(offerFormSchema.safeParse({ ...valid, name: " " }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...valid, maxFreeUnitsPerOrder: "0" }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...valid, buyQuantity: "" }).success).toBe(false);
  });

  it("rejects an end date that isn't after the start date", () => {
    const r = offerFormSchema.safeParse({ ...valid, startsAt: "2030-02-02T10:00", endsAt: "2030-02-01T10:00" });
    expect(r.success).toBe(false);
  });

  it("a SCHEDULED offer needs a future start", () => {
    expect(offerFormSchema.safeParse({ ...valid, status: "SCHEDULED" }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...valid, status: "SCHEDULED", startsAt: "2099-01-01T10:00" }).success).toBe(true);
  });

  it("per-customer limit can't exceed the total limit", () => {
    expect(offerFormSchema.safeParse({ ...valid, usageLimit: "5", usageLimitPerUser: "6" }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...valid, usageLimit: "5", usageLimitPerUser: "5" }).success).toBe(true);
  });

  it("rejects a negative minimum price", () => {
    expect(offerFormSchema.safeParse({ ...valid, minPaidUnitPrice: "-1" }).success).toBe(false);
  });

  it("requires a title", () => {
    expect(offerFormSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });
});

describe("offerFormSchema — offer types", () => {
  const pct = { ...valid, type: "PERCENTAGE" as const, name: "50% Off", discountPercent: "50" };
  const fixed = { ...valid, type: "FIXED" as const, name: "Flat 100 Off", discountAmount: "100" };

  it("a percentage offer needs a percentage between 0 and 100", () => {
    expect(offerFormSchema.safeParse(pct).success).toBe(true);
    expect(offerFormSchema.safeParse({ ...pct, discountPercent: "" }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...pct, discountPercent: "0" }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...pct, discountPercent: "101" }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...pct, discountPercent: "12.345" }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...pct, discountPercent: "12.5" }).success).toBe(true);
  });

  it("a fixed-amount offer needs an amount above 0", () => {
    expect(offerFormSchema.safeParse(fixed).success).toBe(true);
    expect(offerFormSchema.safeParse({ ...fixed, discountAmount: "" }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...fixed, discountAmount: "-5" }).success).toBe(false);
    expect(offerFormSchema.safeParse({ ...fixed, discountAmount: "0" }).success).toBe(false);
  });

  it("buy/free-unit settings only matter for Buy X Get Y Free", () => {
    // A stale invalid value left over from the BOGO form must not block a percentage offer…
    expect(offerFormSchema.safeParse({ ...pct, buyQuantity: "99", maxFreeUnitsPerOrder: "0" }).success).toBe(true);
    // …but still blocks a BOGO one.
    expect(offerFormSchema.safeParse({ ...valid, buyQuantity: "99" }).success).toBe(false);
  });

  it("the discount value of another type is ignored", () => {
    expect(offerFormSchema.safeParse({ ...valid, discountPercent: "999" }).success).toBe(true);
    expect(offerFormSchema.safeParse({ ...pct, discountAmount: "-1" }).success).toBe(true);
  });

  it("rejects an unknown type", () => {
    expect(offerFormSchema.safeParse({ ...valid, type: "FREEBIE" }).success).toBe(false);
  });
});
