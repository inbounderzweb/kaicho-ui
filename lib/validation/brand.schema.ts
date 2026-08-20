import { z } from "zod";

export const brandFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  slug: z
    .string()
    .trim()
    .max(140)
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers, and hyphens only")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  logoMediaId: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0, "Must be 0 or greater"),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;
