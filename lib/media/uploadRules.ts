// Single source of truth for what an admin image upload may be. Every picker
// (product gallery, category, brand, collection, blog, media library) imports
// these, so the limit can never drift between screens. The backend enforces
// the same rule independently (MAX_IMAGE_FILE_SIZE_MB) — the client check is a
// fast, friendly pre-flight, never the security boundary.

export const MAX_IMAGE_MB = 1.5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export interface RejectedFile {
  name: string;
  reason: string;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Why this file can't be uploaded as an image, or null if it can. */
export function imageFileProblem(file: File, maxBytes: number = MAX_IMAGE_BYTES): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Unsupported file type (use JPG, PNG, WebP or AVIF)";
  }
  if (file.size === 0) return "File is empty";
  if (file.size > maxBytes) {
    return `${formatBytes(file.size)} — exceeds the ${+(maxBytes / (1024 * 1024)).toFixed(2)} MB limit`;
  }
  return null;
}

/** Split a selection into uploadable files and per-file rejections. */
export function partitionImageFiles(
  files: File[],
  maxBytes: number = MAX_IMAGE_BYTES
): { valid: File[]; rejected: RejectedFile[] } {
  const valid: File[] = [];
  const rejected: RejectedFile[] = [];
  for (const file of files) {
    const reason = imageFileProblem(file, maxBytes);
    if (reason) rejected.push({ name: file.name, reason });
    else valid.push(file);
  }
  return { valid, rejected };
}
