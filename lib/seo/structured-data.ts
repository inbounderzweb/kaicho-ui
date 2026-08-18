import { absoluteUrl, SITE_URL } from "./urls";
import { SITE_NAME } from "./metadata";

type JsonLd = Record<string, unknown>;

/**
 * Only schemas that genuinely describe this site today. Do NOT add Review /
 * AggregateRating anywhere until real customer review data exists —
 * fabricated structured data is a Google Search Console penalty risk, not a
 * shortcut.
 */

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg"),
    sameAs: [
      "https://www.facebook.com/people/Kaicho-Foods/61577834296853/",
      "https://www.instagram.com/kaichofoods/",
      "https://www.youtube.com/@kaichofoods",
      "https://www.linkedin.com/in/kaicho-foods",
    ],
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

/**
 * Only real fields: name, price, currency and a stable per-product URL all
 * genuinely exist now that /products/[slug] routes do. `availability` is
 * InStock because that's what the visible page itself represents (no
 * out-of-stock state exists anywhere in the UI) — not a fabricated value.
 * No rating/review fields: no real review data exists yet.
 */
export function productJsonLd(product: {
  name: string;
  description: string;
  price: number;
  slug: string;
  image?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    ...(product.image ? { image: absoluteUrl(product.image) } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "INR",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };
}
