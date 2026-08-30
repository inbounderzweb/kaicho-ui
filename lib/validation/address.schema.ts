import { z } from "zod";

// Shared by the checkout AddressSelector's inline "add address" form and
// the profile page's address book — one schema so the two never drift.
// Pincode is India-specific (6 digits, not starting with 0), matching the
// storefront's en-IN/INR assumptions everywhere else.
export const addressFormSchema = z.object({
  label: z.string().trim().max(40, "Label is too long").optional().or(z.literal("")),
  line1: z.string().trim().min(1, "Address line 1 is required").max(200, "Address line 1 is too long"),
  line2: z.string().trim().max(200, "Address line 2 is too long").optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(80, "City is too long"),
  state: z.string().trim().min(1, "State is required").max(80, "State is too long"),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
