import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";

export interface BrandLogo {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
}

export interface AdminBrand {
  brandId: string;
  name: string;
  slug: string;
  description: string | null;
  logo: BrandLogo | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandOption {
  id: string;
  name: string;
}

export type BrandStatusFilter = "all" | "active" | "inactive";

export interface BrandQueryParams extends PageParams {
  search?: string;
  isActive?: BrandStatusFilter;
  sort?: "createdAt" | "name" | "sortOrder";
  order?: "asc" | "desc";
}

export interface BrandFormInput {
  name: string;
  slug?: string;
  description?: string;
  logoMediaId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

function query({ page = 1, pageSize = 20 }: PageParams): string {
  return `?page=${page}&pageSize=${pageSize}`;
}

export function fetchBrands({
  search,
  isActive,
  sort,
  order,
  ...pageParams
}: BrandQueryParams = {}): Promise<Paginated<AdminBrand>> {
  let qs = query(pageParams);
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (isActive === "active") qs += `&isActive=true`;
  else if (isActive === "inactive") qs += `&isActive=false`;
  if (sort) qs += `&sort=${sort}`;
  if (order) qs += `&order=${order}`;
  return apiFetch<Paginated<AdminBrand>>(`/admin/brands${qs}`, { method: "GET" });
}

export function fetchBrandOptions(): Promise<BrandOption[]> {
  return apiFetch<BrandOption[]>("/admin/brands/options", { method: "GET" });
}

export function fetchBrandDetail(id: string): Promise<{ brand: AdminBrand }> {
  return apiFetch<{ brand: AdminBrand }>(`/admin/brands/${encodeURIComponent(id)}`, { method: "GET" });
}

export function createBrand(input: BrandFormInput): Promise<{ brand: AdminBrand }> {
  return apiFetch<{ brand: AdminBrand }>("/admin/brands", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateBrand(id: string, patch: Partial<BrandFormInput>): Promise<{ brand: AdminBrand }> {
  return apiFetch<{ brand: AdminBrand }>(`/admin/brands/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteBrand(id: string): Promise<void> {
  return apiFetch<void>(`/admin/brands/${encodeURIComponent(id)}`, { method: "DELETE" });
}
