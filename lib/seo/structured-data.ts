import { absoluteUrl, SITE_URL } from "./urls";
import { SITE_NAME } from "./metadata";
import { resolveMediaUrl } from "../api/client";

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

/**
 * BlogPosting for a blog detail page. Every field is real content from the
 * public blog DTO — no invented ratings or authorship. `image` is a
 * backend-hosted media URL, so it goes through resolveMediaUrl (the API
 * origin), not absoluteUrl (the site domain), same as productJsonLd's images.
 */
export function blogPostingJsonLd(post: {
  title: string;
  description: string;
  slug: string;
  imageUrl?: string | null;
  authorName?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/blog/${post.slug}`) },
    ...(post.imageUrl ? { image: [resolveMediaUrl(post.imageUrl)] } : {}),
    author: { "@type": "Person", name: post.authorName || SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg") },
    },
    ...(post.datePublished ? { datePublished: post.datePublished } : {}),
    ...(post.dateModified ? { dateModified: post.dateModified } : {}),
  };
}

/**
 * FAQPage — ONLY emit this when the same Q&A pairs are actually rendered on
 * the visible page (see BlogArticle.tsx's FAQ section). Fabricated or
 * hidden FAQ markup is a Search Console penalty risk.
 */
export function faqJsonLd(faqs: { question: string; answer: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
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
 * Every field here comes from the real public product DTO
 * (lib/api/publicProducts.ts's PublicProductDetail) — sku, images, brand
 * name, and pricing/availability are all genuine backend fields now that
 * /api/products/:slug is real. Still no rating/review fields: no real
 * review data exists. `availability` reflects the product's own
 * inventory.inStock rather than being hardcoded, so an out-of-stock
 * product is never misrepresented as available to search engines.
 *
 * `images` are resolved via resolveMediaUrl (the API origin), the same as
 * every other product image in the app, not via absoluteUrl (the site's
 * own domain) — they're backend-hosted media, not site-relative paths.
 */
export function productJsonLd(product: {
  name: string;
  description: string;
  sku: string;
  slug: string;
  images: string[];
  pricing: { mrp: number; sellingPrice: number };
  inStock: boolean;
  brandName?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    ...(product.images.length ? { image: product.images.map((url) => resolveMediaUrl(url)) } : {}),
    brand: {
      "@type": "Brand",
      name: product.brandName || SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "INR",
      price: product.pricing.sellingPrice.toFixed(2),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}
