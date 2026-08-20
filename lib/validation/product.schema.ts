import { z } from "zod";
import { PRODUCT_STATUSES } from "@/lib/api/product";

// Client-side mirror of kaicho-be's product.validation.ts. This is a UX
// convenience (fast feedback, no round-trip for an obviously-invalid form) —
// the backend re-validates everything authoritatively and is the only
// source of truth for what actually gets persisted.
export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(200, "Name is too long"),
    slug: z
      .string()
      .trim()
      .max(220)
      .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers, and hyphens only")
      .optional()
      .or(z.literal("")),
    sku: z
      .string()
      .trim()
      .min(2, "SKU is too short")
      .max(64, "SKU is too long")
      .regex(/^[A-Za-z0-9_-]+$/, "SKU can only contain letters, numbers, hyphens, and underscores"),
    shortDescription: z.string().trim().min(1, "Short description is required").max(300, "Short description is too long"),
    description: z.string().trim().min(1, "Description is required").max(20000, "Description is too long"),
    categoryId: z.string().trim().min(1, "Category is required"),
    brandId: z.string().trim().min(1, "Brand is required"),

    mrp: z.coerce.number().positive("MRP must be greater than 0"),
    sellingPrice: z.coerce.number().positive("Selling price must be greater than 0"),
    costPrice: z.coerce.number().min(0, "Cost price cannot be negative").optional().or(z.literal("")),

    stockQuantity: z.coerce.number().int("Must be a whole number").min(0, "Stock quantity cannot be negative"),
    lowStockThreshold: z.coerce.number().int().min(0, "Must be 0 or greater"),
    trackInventory: z.boolean(),

    seoTitle: z.string().trim().min(10, "SEO title is too short").max(70, "SEO title is too long"),
    seoDescription: z.string().trim().min(40, "SEO description is too short").max(200, "SEO description is too long"),
    seoKeywords: z.array(z.string()).min(1, "At least one SEO keyword is required").max(20, "Maximum 20 SEO keywords"),
    canonicalUrl: z.string().trim().max(500).optional().or(z.literal("")),
    ogTitle: z.string().trim().max(70).optional().or(z.literal("")),
    ogDescription: z.string().trim().max(200).optional().or(z.literal("")),

    status: z.enum(PRODUCT_STATUSES),
    isFeatured: z.boolean(),
    sortOrder: z.coerce.number().int().min(0, "Must be 0 or greater"),
  })
  .refine((data) => data.sellingPrice <= data.mrp, {
    message: "Selling price cannot be greater than MRP",
    path: ["sellingPrice"],
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
