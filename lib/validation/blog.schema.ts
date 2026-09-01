import { z } from "zod";

// Client-side mirror of kaicho-be's blog.validation.ts. The backend re-checks
// everything (and owns the publish-time "content + featured image required"
// gate) — this is just fast inline feedback in the editor.

const slugField = z
  .string()
  .trim()
  .max(220)
  .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers, and hyphens only")
  .optional()
  .or(z.literal(""));

const urlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Must start with http:// or https://")
  .optional()
  .or(z.literal(""));

export const blogFaqSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(300),
  answer: z.string().trim().min(1, "Answer is required").max(2000),
});

export const blogFormSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(200, "Title is too long"),
  slug: slugField,
  excerpt: z.string().trim().min(1, "Excerpt is required").max(320, "Keep the excerpt under 320 characters"),
  categoryId: z.string().min(1, "Choose a category"),
  authorName: z.string().trim().max(120, "Author name is too long").optional().or(z.literal("")),
  author: z.string().optional().or(z.literal("")),

  contentHtml: z.string(),
  tags: z.array(z.string().trim().min(1).max(60)).max(30),
  faqs: z.array(blogFaqSchema).max(30),
  relatedBlogIds: z.array(z.string()).max(12),

  featuredImageMediaId: z.string(),
  thumbnailImageMediaId: z.string(),
  ogImageMediaId: z.string(),

  metaTitle: z.string().trim().max(70, "Meta title is over 70 characters").optional().or(z.literal("")),
  metaDescription: z
    .string()
    .trim()
    .max(200, "Meta description is over 200 characters")
    .optional()
    .or(z.literal("")),
  focusKeyword: z.string().trim().max(120).optional().or(z.literal("")),
  canonicalUrl: urlOrEmpty,
  ogTitle: z.string().trim().max(120).optional().or(z.literal("")),
  ogDescription: z.string().trim().max(200).optional().or(z.literal("")),
  noIndex: z.boolean(),
  noFollow: z.boolean(),
  schemaEnabled: z.boolean(),
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;
