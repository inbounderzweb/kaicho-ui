import { apiFetch } from "./client";
import type { BlogImage } from "./blog";

export type BlogCategoryStatus = "ACTIVE" | "INACTIVE";

export interface AdminBlogCategory {
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  image: BlogImage | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: BlogCategoryStatus;
  blogCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface BlogCategoryFormInput {
  name: string;
  slug?: string;
  description?: string;
  imageMediaId?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  status?: BlogCategoryStatus;
}

export function fetchBlogCategories(params: { search?: string; status?: BlogCategoryStatus | "all" } = {}): Promise<{
  categories: AdminBlogCategory[];
}> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  const s = qs.toString();
  return apiFetch<{ categories: AdminBlogCategory[] }>(`/admin/blog-categories${s ? `?${s}` : ""}`, { method: "GET" });
}

export function fetchBlogCategoryOptions(): Promise<BlogCategoryOption[]> {
  return apiFetch<BlogCategoryOption[]>("/admin/blog-categories/options", { method: "GET" });
}

export function fetchBlogCategoryDetail(id: string): Promise<{ category: AdminBlogCategory }> {
  return apiFetch<{ category: AdminBlogCategory }>(`/admin/blog-categories/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function createBlogCategory(input: BlogCategoryFormInput): Promise<{ category: AdminBlogCategory }> {
  return apiFetch<{ category: AdminBlogCategory }>("/admin/blog-categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateBlogCategory(
  id: string,
  patch: Partial<BlogCategoryFormInput>
): Promise<{ category: AdminBlogCategory }> {
  return apiFetch<{ category: AdminBlogCategory }>(`/admin/blog-categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteBlogCategory(id: string): Promise<void> {
  return apiFetch<void>(`/admin/blog-categories/${encodeURIComponent(id)}`, { method: "DELETE" });
}
