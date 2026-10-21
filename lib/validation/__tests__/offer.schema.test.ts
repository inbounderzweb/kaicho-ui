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
    expect(parsed.minPaidUnitPrice).toBe(0);
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
});
