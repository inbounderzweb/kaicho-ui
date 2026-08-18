import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/urls";

/**
 * No `disallow` rules here on purpose. /login, /cart, /profile and
 * /wishlist are excluded from search results via `noindex` in their own
 * page metadata instead — Google can only see and honor that tag if it's
 * allowed to crawl the page, so blocking them here would work against the
 * noindex rather than reinforcing it. robots.txt is crawl control, not the
 * de-indexing mechanism.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
