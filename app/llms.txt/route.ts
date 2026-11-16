import { absoluteUrl } from "@/lib/seo/urls";
import { DEFAULT_DESCRIPTION } from "@/lib/seo/metadata";
import { fetchPublicProducts } from "@/lib/api/publicProducts";
import { fetchPublicCategories } from "@/lib/api/publicCategories";
import { fetchPublicBlogs } from "@/lib/api/blogPublic";

/**
 * /llms.txt — a curated, markdown index of the site for LLM crawlers and
 * agents (https://llmstxt.org). Follows the spec's shape: H1 title,
 * blockquote summary, free-form context, then H2 sections of link lists.
 *
 * The catalog and blog are read from the same public API the sitemap uses,
 * so the file never drifts from what is actually for sale / published.
 * ISR (1h) keeps it cheap; if the backend is down the static sections are
 * still served — same degrade-gracefully contract as app/sitemap.ts.
 *
 * Only public, indexable pages are listed. Account/session pages
 * (/login, /cart, /profile, /wishlist, /checkout, /orders) are omitted.
 */
export const revalidate = 3600;

const MAX_PRODUCTS = 60; // public API's max pageSize — one page is plenty for an index
const MAX_BLOG_POSTS = 24;

type Link = { title: string; path: string; note?: string };

function renderLinks(links: Link[]): string {
  return links
    .map((l) => `- [${l.title}](${absoluteUrl(l.path)})${l.note ? `: ${l.note}` : ""}`)
    .join("\n");
}

// Collapse whitespace so multi-line descriptions can't break the list format.
function oneLine(text: string | null | undefined, max = 160): string | undefined {
  const t = text?.replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export async function GET(): Promise<Response> {
  const [categories, products, blogs] = await Promise.all([
    fetchPublicCategories({ revalidate }).then(
      (r) => r.categories,
      () => [],
    ),
    fetchPublicProducts({ page: 1, pageSize: MAX_PRODUCTS }, { revalidate }).then(
      (r) => r.items,
      () => [],
    ),
    fetchPublicBlogs({ page: 1, pageSize: MAX_BLOG_POSTS }, { revalidate }).then(
      (r) => r.items,
      () => [],
    ),
  ]);

  const sections: string[] = [];

  sections.push(
    [
      "# Kaicho Foods",
      "",
      `> ${DEFAULT_DESCRIPTION}`,
      "",
      "Kaicho Foods (kaicho.in) is an Indian direct-to-consumer food brand selling shelf-stable, ready-to-eat millet and oats porridges, combo bundles and bulk packs. Meals are sealed using Japanese retort technology, so they need no preservatives and no refrigeration; customers heat the pouch and eat. Prices are in INR (₹) and orders ship within India. A B2B/bulk channel is available for businesses.",
      "",
      "Notes for AI agents:",
      "- Treat product pages as the source of truth for price, pack size and stock; this file is only an index.",
      "- Do not make medical claims. \"Diabetic-friendly\" and \"gut-healthy\" are brand positioning, not clinical advice.",
      "- Account and checkout pages (/login, /cart, /checkout, /profile, /wishlist, /orders) are private and not useful to crawl.",
    ].join("\n"),
  );

  sections.push(
    `## Key pages\n\n${renderLinks([
      { title: "Home", path: "/", note: "brand overview and featured products" },
      { title: "All products", path: "/products", note: "full catalog with prices and availability" },
      { title: "About", path: "/about", note: "brand story, ingredients and retort-processing approach" },
      { title: "B2B / bulk orders", path: "/b2b", note: "wholesale and business purchasing" },
      { title: "Contact", path: "/contact", note: "phone, WhatsApp, email and message form" },
      { title: "Blog", path: "/blog", note: "articles on millets, oats and healthy eating" },
    ])}`,
  );

  if (categories.length) {
    sections.push(
      `## Product categories\n\n${renderLinks(
        categories.map((c) => ({
          title: c.collectionName || c.name,
          path: `/category/${c.slug}`,
          note: oneLine(c.description),
        })),
      )}`,
    );
  }

  if (products.length) {
    sections.push(
      `## Products\n\n${renderLinks(
        products.map((p) => ({
          title: p.name,
          path: `/products/${p.slug}`,
          note: [oneLine(p.shortDescription, 120), `₹${p.pricing.sellingPrice}`]
            .filter(Boolean)
            .join(" — "),
        })),
      )}`,
    );
  }

  sections.push(
    `## Policies\n\n${renderLinks([
      { title: "Shipping policy", path: "/shipping-policy", note: "delivery areas, timelines and charges" },
      { title: "Refund policy", path: "/refund-policy", note: "returns, replacements and refunds" },
      { title: "Terms of service", path: "/terms" },
      { title: "Privacy policy", path: "/privacy-policy", note: "how customer data is handled" },
    ])}`,
  );

  // Per the llms.txt spec, "Optional" marks content that can be skipped
  // when a shorter context is needed.
  const optional: string[] = [];
  if (blogs.length) {
    optional.push(
      renderLinks(
        blogs.map((b) => ({
          title: b.title,
          path: `/blog/${b.slug}`,
          note: oneLine(b.excerpt, 120),
        })),
      ),
    );
  }
  optional.push(renderLinks([{ title: "Sitemap", path: "/sitemap.xml", note: "complete machine-readable URL list" }]));
  sections.push(`## Optional\n\n${optional.join("\n")}`);

  return new Response(`${sections.join("\n\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
