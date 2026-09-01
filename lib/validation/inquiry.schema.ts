import { z } from "zod";
import { isValidIndianMobile, MOBILE_ERROR } from "./phone";

// Client mirror of kaicho-be/src/modules/inquiry/inquiry.validation.ts. The
// backend re-checks everything — this is fast inline feedback in the forms.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const name = z.string().trim().min(1, "Please enter your name").max(120, "Name is too long");
const email = z.string().trim().max(160).regex(EMAIL_RE, "Enter a valid email");

export const contactFormSchema = z.object({
  name,
  email,
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || isValidIndianMobile(v), MOBILE_ERROR)
    .optional()
    .or(z.literal("")),
  message: z.string().trim().min(1, "Please enter a message").max(5000, "Message is too long"),
});

export const bulkOrderFormSchema = z.object({
  name,
  email,
  phone: z.string().trim().max(20).refine((v) => isValidIndianMobile(v), MOBILE_ERROR),
  quantity: z.coerce
    .number({ invalid_type_error: "Enter a quantity" })
    .int("Whole numbers only")
    .positive("Must be greater than 0")
    .max(10_000_000, "That's a very large quantity"),
  purpose: z.string().trim().min(1, "Tell us the purpose").max(200, "Purpose is too long"),
  message: z.string().trim().max(5000, "Message is too long").optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type BulkOrderFormValues = z.infer<typeof bulkOrderFormSchema>;
