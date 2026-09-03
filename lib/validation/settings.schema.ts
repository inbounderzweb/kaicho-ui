import { z } from "zod";

// z.coerce.number so the <input type="number"> string value validates and is
// handed to the API as a number. Whole rupees, non-negative, sane ceiling —
// mirrors the backend's settings.validation.ts.
const amount = z.coerce
  .number()
  .int("Enter a whole number")
  .min(0, "Must be 0 or greater")
  .max(100000, "That value looks too high");

export const storeSettingsFormSchema = z.object({
  freeShippingThreshold: amount,
  flatShippingFee: amount,
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsFormSchema>;
