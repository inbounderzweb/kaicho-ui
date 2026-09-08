// Client-side mirror of kaicho-be's instagramUrl.ts. It exists purely for
// inline form feedback + the local preview — the backend re-parses and is
// authoritative (same reason lib/constants/roles.ts duplicates the server
// enum across the repo boundary). Keep the two in sync.

export type InstagramPostType = "POST" | "REEL";

export interface ParsedInstagramUrl {
  postType: InstagramPostType;
  shortCode: string;
  /** `https://www.instagram.com/{p|reel}/{shortCode}/` */
  canonicalUrl: string;
}

export const MAX_INSTAGRAM_URL_LENGTH = 2048;

const SHORTCODE_RE = /^[A-Za-z0-9_-]{1,64}$/;
const ALLOWED_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
const PATH_RE = /^\/(p|reel|reels)\/([A-Za-z0-9_-]+)\/?$/;

export function parseInstagramUrl(raw: string): ParsedInstagramUrl | null {
  const input = raw.trim();
  if (!input || input.length > MAX_INSTAGRAM_URL_LENGTH) return null;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;

  const match = PATH_RE.exec(url.pathname);
  if (!match) return null;

  const postType: InstagramPostType = match[1] === "p" ? "POST" : "REEL";
  const shortCode = match[2];
  if (!SHORTCODE_RE.test(shortCode)) return null;

  const segment = postType === "POST" ? "p" : "reel";
  return { postType, shortCode, canonicalUrl: `https://www.instagram.com/${segment}/${shortCode}/` };
}
