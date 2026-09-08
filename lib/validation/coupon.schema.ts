import { z } from "zod";
import { COUPON_DISCOUNT_TYPES } from "../api/coupon";

// UX-layer validation for the admin coupon form. The backend
// (adminCoupon.validation.ts + the Coupon model hook) is authoritative and
// re-checks every one of these — this just gives inline feedback.

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

const optionalPositiveInt = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ message: "Enter a number" })
    .int("Whole numbers only")
    .positive("Must be at least 1")
    .optional()
);

const optionalPositiveAmount = z.preprocess(
  emptyToUndefined,
  z.coerce.number({ message: "Enter a number" }).positive("Must be greater than 0").optional()
);

const optionalDate = z.preprocess(emptyToUndefined, z.string().optional());

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(40, "Too long")
      .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "Letters, digits, hyphens and underscores only"),
    name: z.string().trim().min(1, "Name is required").max(120, "Too long"),
    description: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
    discountType: z.enum(COUPON_DISCOUNT_TYPES),
    // Defaults to 0 so a FREE_DELIVERY coupon (whose value input is hidden and
    // stays "") still submits. The superRefine below enforces the real bounds
    // for PERCENTAGE (1–100) and FIXED (> 0).
    discountValue: z.preprocess(
      emptyToUndefined,
      z.coerce.number({ message: "Enter a number" }).min(0, "Cannot be negative").default(0)
    ),
    maxDiscountAmount: optionalPositiveAmount,
    minOrderValue: z.preprocess(
      emptyToUndefined,
      z.coerce.number({ message: "Enter a number" }).min(0, "Cannot be negative").default(0)
    ),
    startsAt: optionalDate,
    expiresAt: optionalDate,
    usageLimit: optionalPositiveInt,
    usageLimitPerUser: optionalPositiveInt,
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "PERCENTAGE") {
      if (data.discountValue < 1 || data.discountValue > 100) {
        ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Between 1 and 100" });
      }
    } else if (data.discountType === "FIXED") {
      if (data.discountValue <= 0) {
        ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Must be greater than 0" });
      }
    }
    if (data.startsAt && data.expiresAt && new Date(data.expiresAt) <= new Date(data.startsAt)) {
      ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Must be after the start date" });
    }
    if (
      data.usageLimit !== undefined &&
      data.usageLimitPerUser !== undefined &&
      data.usageLimitPerUser > data.usageLimit
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["usageLimitPerUser"],
        message: "Cannot exceed the total usage limit",
      });
    }
  });

export type CouponFormValues = z.input<typeof couponFormSchema>;
export type CouponFormParsed = z.output<typeof couponFormSchema>;
