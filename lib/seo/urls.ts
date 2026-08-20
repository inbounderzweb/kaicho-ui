/**
 * NEXT_PUBLIC_SITE_URL lets staging/preview deployments override the
 * canonical domain; production falls back to the real Kaicho domain so
 * canonical/OG/sitemap URLs are never accidentally localhost.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kaicho.in";

/**
 * Resolves a site-relative path to an absolute URL against SITE_URL.
 * `absoluteUrl("/blog")` -> "https://kaicho.in/blog"
 * `absoluteUrl()` -> "https://kaicho.in"
 *
 * An already-absolute http(s) URL is returned unchanged — needed now that
 * callers pass backend-hosted product/category media URLs (resolved via
 * lib/api/client's resolveMediaUrl, a different origin entirely) through
 * the same OG-image/JSON-LD-image plumbing as site-relative asset paths.
 * Without this, "http://api.example.com/uploads/x.webp" would get
 * mangled into "https://kaicho.in/http://api.example.com/uploads/x.webp".
 */
export function absoluteUrl(path: string = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? SITE_URL : `${SITE_URL}${normalized}`;
}
