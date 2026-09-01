import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/urls";
import { fetchPublicProducts } from "@/lib/api/publicProducts";
import { fetchPublicCategories } from "@/lib/api/publicCategories";
import { fetchPublicBlogs, fetchPublicBlogCategories } from "@/lib/api/blogPublic";

/**
 * Only real, indexable, public pages — kept in sync with each page's own
 * `robots` metadata. /login, /cart, /profile and /wishlist are
 * intentionally omitted: they're noindex account/session pages, not
 * content Google should discover via the sitemap.
 */
const ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/products", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/b2b", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/shipping-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refund-policy", changeFrequency: "yearly", priority: 0.3 },
];

const PRODUCT_PAGE_SIZE = 60; // the public API's max pageSize

async function fetchAllProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;

  // Bounded to 50 pages (3000 products) as a sanity ceiling — this walks
  // the live public listing endpoint page by page rather than assuming any
  // particular catalog size.
  for (let i = 0; i < 50; i++) {
    const result = await fetchPublicProducts({ page, pageSize: PRODUCT_PAGE_SIZE });
    slugs.push(...result.items.map((p) => p.slug));
    if (page * PRODUCT_PAGE_SIZE >= result.total) break;
    page += 1;
  }

  return slugs;
}

const BLOG_PAGE_SIZE = 24; // the public blog API's max pageSize

// Walks the live public blog listing — which already excludes
// draft/scheduled/archived/noIndex posts server-side (see kaicho-be
// blog.service.ts's getPublishedBlogSlugsForSitemap / publicMatch) — so
// nothing unpublished can leak into the sitemap.
async function fetchAllBlogEntries(lastModified: Date): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  let page = 1;
  for (let i = 0; i < 50; i++) {
    const result = await fetchPublicBlogs({ page, pageSize: BLOG_PAGE_SIZE });
    for (const post of result.items) {
      entries.push({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.publishedAt ? new Date(post.publishedAt) : lastModified,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    if (page * BLOG_PAGE_SIZE >= result.total) break;
    page += 1;
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries = ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // The sitemap must still build/render even if the backend is briefly
  // unreachable — falling back to the static entries above rather than
  // failing the whole route.
  let productEntries: MetadataRoute.Sitemap = [];
  let categoryEntries: MetadataRoute.Sitemap = [];
  let blogEntries: MetadataRoute.Sitemap = [];
  let blogCategoryEntries: MetadataRoute.Sitemap = [];

  try {
    const [slugs, categoriesResult, blogs, blogCategoriesResult] = await Promise.all([
      fetchAllProductSlugs(),
      fetchPublicCategories(),
      fetchAllBlogEntries(lastModified),
      fetchPublicBlogCategories(),
    ]);

    productEntries = slugs.map((slug) => ({
      url: absoluteUrl(`/products/${slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    categoryEntries = categoriesResult.categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    blogEntries = blogs;

    blogCategoryEntries = blogCategoriesResult.categories.map((category) => ({
      url: absoluteUrl(`/blog/category/${category.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch {
    // Backend unreachable at build/request time — ship the static routes
    // only rather than failing sitemap generation entirely.
  }

  return [
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
    ...blogCategoryEntries,
    ...blogEntries,
  ];
}
