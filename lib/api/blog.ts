import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";

// Admin blog CRUD client. Blogs are addressed by Mongo _id here (the admin
// already has the id from the list response); the public client
// (blogPublic.ts) is slug-first. Same split as product.ts vs publicProducts.ts.

export const BLOG_STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export type BlogSeoReadiness = "good" | "needs-work" | "poor";

export interface BlogImage {
  mediaId: string;
  url: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  altText: string | null;
}

export interface BlogAuthorRef {
  userId: string;
  name: string;
  avatar: string | null;
}

export interface BlogCategoryRef {
  categoryId: string;
  name: string;
  slug: string;
}

export interface BlogTagRef {
  tagId: string;
  name: string;
  slug: string;
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogTocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface SeoChecklistItem {
  key: string;
  label: string;
  passed: boolean;
}

export interface SeoChecklistResult {
  items: SeoChecklistItem[];
  passedCount: number;
  totalCount: number;
  readiness: BlogSeoReadiness;
}

export interface AdminBlogListItem {
  blogId: string;
  title: string;
  slug: string;
  status: BlogStatus;
  category: BlogCategoryRef | null;
  author: BlogAuthorRef | null;
  thumbnailImage: BlogImage | null;
  tagCount: number;
  seoReadiness: BlogSeoReadiness;
  seoScore: number;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBlogSeo {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: BlogImage | null;
  noIndex: boolean;
  noFollow: boolean;
}

export interface AdminBlogDetail {
  blogId: string;
  title: string;
  slug: string;
  previousSlugs: string[];
  excerpt: string;
  contentHtml: string;
  author: BlogAuthorRef | null;
  category: BlogCategoryRef | null;
  tags: BlogTagRef[];
  status: BlogStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  statusHistory: { status: BlogStatus; at: string; byUserId: string | null; note: string | null }[];
  featuredImage: BlogImage | null;
  thumbnailImage: BlogImage | null;
  seo: AdminBlogSeo;
  readingTimeMinutes: number;
  tableOfContents: BlogTocItem[];
  schemaEnabled: boolean;
  faqs: BlogFaq[];
  relatedBlogIds: string[];
  seoReadiness: BlogSeoReadiness;
  seoScore: number;
  seoChecklist: SeoChecklistResult | null;
  createdAt: string;
  updatedAt: string;
}

export type BlogSortOption = "newest" | "oldest" | "updated" | "title-asc" | "title-desc";

export interface AdminBlogQueryParams extends PageParams {
  status?: BlogStatus | "all";
  categoryId?: string;
  author?: string;
  tag?: string;
  seoStatus?: BlogSeoReadiness | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: BlogSortOption;
}

export interface BlogSeoInput {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageMediaId?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface BlogFormInput {
  title: string;
  slug?: string;
  excerpt: string;
  contentHtml?: string;
  featuredImageMediaId?: string | null;
  thumbnailImageMediaId?: string | null;
  author?: string;
  authorName?: string;
  categoryId: string;
  tags?: string[];
  seo?: BlogSeoInput;
  faqs?: BlogFaq[];
  relatedBlogIds?: string[];
  schemaEnabled?: boolean;
}

export interface BulkBlogActionResult {
  succeeded: string[];
  failed: { id: string; ok: boolean; error?: string }[];
}

function buildQuery(params: AdminBlogQueryParams): string {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  if (params.author) qs.set("author", params.author);
  if (params.tag) qs.set("tag", params.tag);
  if (params.seoStatus && params.seoStatus !== "all") qs.set("seoStatus", params.seoStatus);
  if (params.search) qs.set("search", params.search);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.sort) qs.set("sort", params.sort);
  return `?${qs.toString()}`;
}

export function fetchAdminBlogs(params: AdminBlogQueryParams = {}): Promise<Paginated<AdminBlogListItem>> {
  return apiFetch<Paginated<AdminBlogListItem>>(`/admin/blogs${buildQuery(params)}`, { method: "GET" });
}

export function fetchAdminBlogDetail(id: string): Promise<{ blog: AdminBlogDetail }> {
  return apiFetch<{ blog: AdminBlogDetail }>(`/admin/blogs/${encodeURIComponent(id)}`, { method: "GET" });
}

export function createBlog(input: BlogFormInput): Promise<{ blog: AdminBlogDetail }> {
  return apiFetch<{ blog: AdminBlogDetail }>("/admin/blogs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateBlog(id: string, patch: Partial<BlogFormInput>): Promise<{ blog: AdminBlogDetail }> {
  return apiFetch<{ blog: AdminBlogDetail }>(`/admin/blogs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function setBlogStatus(
  id: string,
  body: { status: BlogStatus; scheduledFor?: string; note?: string }
): Promise<{ blog: AdminBlogDetail }> {
  return apiFetch<{ blog: AdminBlogDetail }>(`/admin/blogs/${encodeURIComponent(id)}/status`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function scheduleBlog(
  id: string,
  body: { scheduledFor: string; note?: string }
): Promise<{ blog: AdminBlogDetail }> {
  return apiFetch<{ blog: AdminBlogDetail }>(`/admin/blogs/${encodeURIComponent(id)}/schedule`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function duplicateBlog(id: string): Promise<{ blog: AdminBlogDetail }> {
  return apiFetch<{ blog: AdminBlogDetail }>(`/admin/blogs/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
  });
}

export function deleteBlog(id: string, hard = false): Promise<void> {
  return apiFetch<void>(`/admin/blogs/${encodeURIComponent(id)}${hard ? "?hard=true" : ""}`, {
    method: "DELETE",
  });
}

export function bulkBlogAction(
  ids: string[],
  action: "publish" | "unpublish" | "archive" | "delete"
): Promise<BulkBlogActionResult> {
  return apiFetch<BulkBlogActionResult>("/admin/blogs/bulk", {
    method: "POST",
    body: JSON.stringify({ ids, action }),
  });
}
