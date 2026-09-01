import { apiFetch } from "./client";

export interface AdminBlogTag {
  tagId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export function fetchBlogTags(search?: string): Promise<{ tags: AdminBlogTag[] }> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<{ tags: AdminBlogTag[] }>(`/admin/blog-tags${qs}`, { method: "GET" });
}

export function createBlogTag(name: string): Promise<{ tag: AdminBlogTag }> {
  return apiFetch<{ tag: AdminBlogTag }>("/admin/blog-tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateBlogTag(id: string, name: string): Promise<{ tag: AdminBlogTag }> {
  return apiFetch<{ tag: AdminBlogTag }>(`/admin/blog-tags/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteBlogTag(id: string): Promise<void> {
  return apiFetch<void>(`/admin/blog-tags/${encodeURIComponent(id)}`, { method: "DELETE" });
}
