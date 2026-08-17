import { absoluteUrl, SITE_URL } from "./urls";
import { SITE_NAME } from "./metadata";

type JsonLd = Record<string, unknown>;

/**
 * Only schemas that genuinely describe this site today. Do NOT add
 * Product/Offer/Review/AggregateRating here until real product/category
 * routes exist with real price, availability, and review data — fabricated
 * structured data is a Google Search Console penalty risk, not a shortcut.
 */

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg"),
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/**
 * Not used yet (single-route site). Ready for when product/category pages
 * exist and need real breadcrumb trails.
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
