import { z } from "zod";

// Shared by the checkout AddressSelector's inline "add address" form and
// the profile page's address book — one schema so the two never drift.
// Pincode is India-specific (6 digits, not starting with 0), matching the
// storefront's en-IN/INR assumptions everywhere else.
export const addressFormSchema = z.object({
  label: z.string().trim().max(40, "Label is too long").optional().or(z.literal("")),
  receiverName: z
    .string()
    .trim()
    .min(2, "Receiver name is required")
    .max(80, "Receiver name is too long"),
  receiverPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  houseNo: z
    .string()
    .trim()
    .min(1, "House / flat number is required")
    .max(60, "House / flat number is too long"),
  building: z.string().trim().max(80, "Building / block is too long").optional().or(z.literal("")),
  area: z
    .string()
    .trim()
    .min(3, "Street / area is required")
    .max(120, "Street / area is too long"),
  landmark: z.string().trim().max(120, "Landmark is too long").optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required").max(80, "City is too long"),
  state: z.string().trim().min(1, "State is required").max(80, "State is too long"),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
