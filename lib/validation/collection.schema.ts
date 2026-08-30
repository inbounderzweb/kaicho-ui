import { z } from "zod";

export const collectionFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  slug: z.string().trim().max(140).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  imageMediaId: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0, "Must be 0 or greater"),
});

export type CollectionFormValues = z.infer<typeof collectionFormSchema>;
