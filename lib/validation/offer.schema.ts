import { z } from "zod";

// UX-layer validation for the admin offer form. The backend
// (adminOffer.validation.ts + the Offer model hook) is authoritative and
// re-checks every rule — this just gives inline feedback.

const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);

const optionalPositiveInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number({ message: "Enter a number" }).int("Whole numbers only").positive("Must be at least 1").optional()
);

const requiredInt = (label: string, min: number, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ message: `${label} is required` })
      .int("Whole numbers only")
      .min(min, `At least ${min}`)
      .max(max, `At most ${max}`)
  );

const optionalDate = z.preprocess(emptyToUndefined, z.string().optional());

export const offerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Offer name is required").max(120, "Too long"),
    description: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
    type: z.literal("BOGO"),
    applyToAll: z.literal(false),
    buyQuantity: requiredInt("Purchase quantity", 1, 10),
    maxFreeUnitsPerOrder: requiredInt("Maximum free units", 1, 100),
    minPaidUnitPrice: z.preprocess(
      emptyToUndefined,
      z.coerce.number({ message: "Enter a number" }).min(0, "Cannot be negative").default(0)
    ),
    allowCouponStacking: z.boolean(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    usageLimit: optionalPositiveInt,
    usageLimitPerUser: optionalPositiveInt,
    status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "DISABLED"]),
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Must be after the start date" });
    }
    if (data.status === "SCHEDULED" && (!data.startsAt || new Date(data.startsAt) <= new Date())) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "A scheduled offer needs a future start" });
    }
    if (data.usageLimit !== undefined && data.usageLimitPerUser !== undefined && data.usageLimitPerUser > data.usageLimit) {
      ctx.addIssue({ code: "custom", path: ["usageLimitPerUser"], message: "Cannot exceed the total usage limit" });
    }
  });

export type OfferFormValues = z.input<typeof offerFormSchema>;
export type OfferFormParsed = z.output<typeof offerFormSchema>;
