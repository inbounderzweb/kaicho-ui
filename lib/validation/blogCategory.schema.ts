import { z } from "zod";

export const blogCategoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  slug: z
    .string()
    .trim()
    .max(140)
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers, and hyphens only")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  metaTitle: z.string().trim().max(70, "Meta title is over 70 characters").optional().or(z.literal("")),
  metaDescription: z
    .string()
    .trim()
    .max(200, "Meta description is over 200 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>;
