import { z } from "zod";
import { parseInstagramUrl, MAX_INSTAGRAM_URL_LENGTH } from "../utils/instagramUrl";

// Inline UX validation for the admin form. The backend
// (instagramPost.validation.ts) re-validates and is authoritative.
export const instagramPostFormSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter an Instagram post URL")
    .max(MAX_INSTAGRAM_URL_LENGTH, "That URL is too long")
    .refine((v) => parseInstagramUrl(v) !== null, {
      message: "Enter a valid Instagram post (/p/) or reel (/reel/) link",
    }),
  displayOrder: z.coerce
    .number({ message: "Enter a number" })
    .int("Whole numbers only")
    .min(0, "Cannot be negative"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type InstagramPostFormValues = z.input<typeof instagramPostFormSchema>;
export type InstagramPostFormParsed = z.output<typeof instagramPostFormSchema>;
