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
 */
export function absoluteUrl(path: string = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? SITE_URL : `${SITE_URL}${normalized}`;
}
