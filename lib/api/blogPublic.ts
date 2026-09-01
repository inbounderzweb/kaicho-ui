import { apiFetch } from "./client";
import type { BlogImage, BlogFaq, BlogTocItem, BlogCategoryRef, BlogTagRef } from "./blog";

// Unauthenticated customer-facing blog client. Published-only, slug-addressed,
// a smaller DTO than the admin client. Mirrors publicProducts.ts.

export interface PublicBlogAuthor {
  name: string;
  avatar: string | null;
}

export interface PublicBlogListItem {
  blogId: string;
  title: string;
  slug: string;
  excerpt: string;
  category: BlogCategoryRef | null;
  author: PublicBlogAuthor | null;
  image: BlogImage | null;
  publishedAt: string | null;
  readingTimeMinutes: number;
}

export interface PublicBlogSeo {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: BlogImage | null;
  noIndex: boolean;
  noFollow: boolean;
}

export interface PublicBlogDetail {
  blogId: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  category: BlogCategoryRef | null;
  author: PublicBlogAuthor | null;
  tags: BlogTagRef[];
  featuredImage: BlogImage | null;
  readingTimeMinutes: number;
  tableOfContents: BlogTocItem[];
  faqs: BlogFaq[];
  schemaEnabled: boolean;
  publishedAt: string | null;
  updatedAt: string;
  seo: PublicBlogSeo;
}

export interface PublicBlogListResult {
  items: PublicBlogListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PublicBlogCategory {
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  image: BlogImage | null;
  postCount: number;
}

export interface PublicBlogListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  search?: string;
}

export function buildBlogQueryString(params: PublicBlogListParams): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.category) qs.set("category", params.category);
  if (params.tag) qs.set("tag", params.tag);
  if (params.search) qs.set("search", params.search);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function fetchPublicBlogs(params: PublicBlogListParams = {}): Promise<PublicBlogListResult> {
  return apiFetch<PublicBlogListResult>(`/blogs${buildBlogQueryString(params)}`, { method: "GET" });
}

export function fetchPublicBlogBySlug(
  slug: string
): Promise<{ blog: PublicBlogDetail; redirectedFrom: string | null }> {
  return apiFetch<{ blog: PublicBlogDetail; redirectedFrom: string | null }>(
    `/blogs/${encodeURIComponent(slug)}`,
    { method: "GET" }
  );
}

export function fetchRelatedBlogs(slug: string, limit = 3): Promise<{ blogs: PublicBlogListItem[] }> {
  return apiFetch<{ blogs: PublicBlogListItem[] }>(
    `/blogs/${encodeURIComponent(slug)}/related?limit=${limit}`,
    { method: "GET" }
  );
}

export function fetchPublicBlogCategories(): Promise<{ categories: PublicBlogCategory[] }> {
  return apiFetch<{ categories: PublicBlogCategory[] }>("/blogs/categories", { method: "GET" });
}

export function fetchPublicBlogCategoryBySlug(slug: string): Promise<{
  category: { categoryId: string; name: string; slug: string; description: string | null; image: BlogImage | null; metaTitle: string | null; metaDescription: string | null };
}> {
  return apiFetch(`/blogs/categories/${encodeURIComponent(slug)}`, { method: "GET" });
}
