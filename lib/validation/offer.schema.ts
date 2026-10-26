import { z } from "zod";

// UX-layer validation for the admin offer form. The backend
// (adminOffer.validation.ts + adminOffer.service.ts) is authoritative and
// re-checks every rule — this just gives inline feedback.
//
// Which fields matter depends on the offer type, so the type-specific numbers
// are parsed loosely here and checked in superRefine only for the type that
// uses them (a hidden, stale value from another type can never block a save).

const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);

const optionalPositiveInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number({ message: "Enter a number" }).int("Whole numbers only").positive("Must be at least 1").optional()
);

const looseNumber = z.preprocess(emptyToUndefined, z.coerce.number({ message: "Enter a number" }).optional());

const optionalDate = z.preprocess(emptyToUndefined, z.string().optional());

export const offerFormSchema = z
  .object({
    // The offer's customer-facing title ("Buy 1 Get 1 Free", "50% Off", …).
    name: z.string().trim().min(1, "Offer title is required").max(120, "Too long"),
    description: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
    type: z.enum(["BOGO", "PERCENTAGE", "FIXED"]),
    applyToAll: z.literal(false),
    // Buy X Get Y Free
    buyQuantity: looseNumber,
    maxFreeUnitsPerOrder: looseNumber,
    minPaidUnitPrice: looseNumber,
    // Percentage / fixed
    discountPercent: looseNumber,
    discountAmount: looseNumber,
    allowCouponStacking: z.boolean(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    usageLimit: optionalPositiveInt,
    usageLimitPerUser: optionalPositiveInt,
    status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "DISABLED"]),
  })
  .superRefine((data, ctx) => {
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

    if (data.type === "BOGO") {
      const buy = data.buyQuantity;
      if (buy === undefined) issue("buyQuantity", "Purchase quantity is required");
      else if (!Number.isInteger(buy)) issue("buyQuantity", "Whole numbers only");
      else if (buy < 1 || buy > 10) issue("buyQuantity", "Enter 1 to 10");

      const max = data.maxFreeUnitsPerOrder;
      if (max === undefined) issue("maxFreeUnitsPerOrder", "Maximum free units is required");
      else if (!Number.isInteger(max)) issue("maxFreeUnitsPerOrder", "Whole numbers only");
      else if (max < 1 || max > 100) issue("maxFreeUnitsPerOrder", "Enter 1 to 100");

      if (data.minPaidUnitPrice !== undefined && data.minPaidUnitPrice < 0) {
        issue("minPaidUnitPrice", "Cannot be negative");
      }
    }
    if (data.type === "PERCENTAGE") {
      const p = data.discountPercent;
      if (p === undefined) issue("discountPercent", "Enter the discount percentage");
      else if (p <= 0 || p > 100) issue("discountPercent", "Enter more than 0 and up to 100");
      else if (Math.abs(Math.round(p * 100) - p * 100) > 1e-9) issue("discountPercent", "At most 2 decimal places");
    }
    if (data.type === "FIXED") {
      const a = data.discountAmount;
      if (a === undefined) issue("discountAmount", "Enter the discount amount");
      else if (a <= 0) issue("discountAmount", "Must be more than 0");
      else if (Math.abs(Math.round(a * 100) - a * 100) > 1e-9) issue("discountAmount", "At most 2 decimal places");
    }

    if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
      issue("endsAt", "Must be after the start date");
    }
    if (data.status === "SCHEDULED" && (!data.startsAt || new Date(data.startsAt) <= new Date())) {
      issue("startsAt", "A scheduled offer needs a future start");
    }
    if (data.usageLimit !== undefined && data.usageLimitPerUser !== undefined && data.usageLimitPerUser > data.usageLimit) {
      issue("usageLimitPerUser", "Cannot exceed the total usage limit");
    }
  });

export type OfferFormValues = z.input<typeof offerFormSchema>;
export type OfferFormParsed = z.output<typeof offerFormSchema>;
