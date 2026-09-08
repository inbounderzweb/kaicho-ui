import { z } from "zod";
import { parseYouTubeUrl, MAX_YOUTUBE_URL_LENGTH } from "../utils/youtubeUrl";

// Inline UX validation for the admin form. The backend
// (youtubeVideo.validation.ts) re-validates and is authoritative.
export const youtubeVideoFormSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a YouTube video URL")
    .max(MAX_YOUTUBE_URL_LENGTH, "That URL is too long")
    .refine((v) => parseYouTubeUrl(v) !== null, {
      message: "Enter a valid YouTube video, short or youtu.be link",
    }),
  displayOrder: z.coerce
    .number({ message: "Enter a number" })
    .int("Whole numbers only")
    .min(0, "Cannot be negative"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type YouTubeVideoFormValues = z.input<typeof youtubeVideoFormSchema>;
export type YouTubeVideoFormParsed = z.output<typeof youtubeVideoFormSchema>;
