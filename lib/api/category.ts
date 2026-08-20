import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";

export interface CategoryImage {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
}

export interface AdminCategory {
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  image: CategoryImage | null;
  parentId: string | null;
  parentName: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryDetail extends AdminCategory {
  parent: { id: string; name: string; slug: string } | null;
}

export interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
}

export type CategoryStatusFilter = "all" | "active" | "inactive";

export interface CategoryQueryParams extends PageParams {
  search?: string;
  parentId?: string; // category id, or "root" for top-level only
  isActive?: CategoryStatusFilter;
  sort?: "createdAt" | "name" | "sortOrder";
  order?: "asc" | "desc";
}

export interface CategoryFormInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  imageMediaId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

function query({ page = 1, pageSize = 20 }: PageParams): string {
  return `?page=${page}&pageSize=${pageSize}`;
}

export function fetchCategories({
  search,
  parentId,
  isActive,
  sort,
  order,
  ...pageParams
}: CategoryQueryParams = {}): Promise<Paginated<AdminCategory>> {
  let qs = query(pageParams);
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (parentId) qs += `&parentId=${encodeURIComponent(parentId)}`;
  if (isActive === "active") qs += `&isActive=true`;
  else if (isActive === "inactive") qs += `&isActive=false`;
  if (sort) qs += `&sort=${sort}`;
  if (order) qs += `&order=${order}`;
  return apiFetch<Paginated<AdminCategory>>(`/admin/categories${qs}`, { method: "GET" });
}

export function fetchCategoryOptions(): Promise<CategoryOption[]> {
  return apiFetch<CategoryOption[]>("/admin/categories/options", { method: "GET" });
}

export function fetchCategoryDetail(id: string): Promise<{ category: AdminCategoryDetail }> {
  return apiFetch<{ category: AdminCategoryDetail }>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function createCategory(input: CategoryFormInput): Promise<{ category: AdminCategoryDetail }> {
  return apiFetch<{ category: AdminCategoryDetail }>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(
  id: string,
  patch: Partial<CategoryFormInput>
): Promise<{ category: AdminCategoryDetail }> {
  return apiFetch<{ category: AdminCategoryDetail }>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
}
