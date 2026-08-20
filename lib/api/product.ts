import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE", "OUT_OF_STOCK", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface ProductImage {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductPricing {
  mrp: number;
  sellingPrice: number;
  costPrice?: number;
  discount: number;
  discountPercentage: number;
}

export interface ProductInventory {
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
}

export interface ProductSeo {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageMediaId?: string;
}

export interface AdminProductListItem {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  category: { id: string; name: string | null };
  brand: { id: string; name: string | null };
  image: ProductImage | null;
  pricing: ProductPricing;
  inventory: ProductInventory;
  status: ProductStatus;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductDetail {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
  categoryId: string;
  brandId: string;
  images: ProductImage[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  seo: ProductSeo;
  status: ProductStatus;
  isFeatured: boolean;
  sortOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProductStockFilter = "all" | "inStock" | "outOfStock";
export type ProductStatusFilter = "all" | ProductStatus;

export interface ProductQueryParams extends PageParams {
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatusFilter;
  isFeatured?: "all" | "true" | "false";
  minPrice?: number;
  maxPrice?: number;
  inStock?: ProductStockFilter;
  sort?: "name" | "createdAt" | "sortOrder" | "price" | "stock";
  order?: "asc" | "desc";
}

export interface ProductFormInput {
  name: string;
  slug?: string;
  sku: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  brandId: string;
  mediaIds: string[];
  pricing: { mrp: number; sellingPrice: number; costPrice?: number };
  inventory: { stockQuantity: number; lowStockThreshold?: number; trackInventory?: boolean };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImageMediaId?: string | null;
  };
  status?: ProductStatus;
  isFeatured?: boolean;
  sortOrder?: number;
}

function query({ page = 1, pageSize = 20 }: PageParams): string {
  return `?page=${page}&pageSize=${pageSize}`;
}

export function fetchProducts({
  search,
  categoryId,
  brandId,
  status,
  isFeatured,
  minPrice,
  maxPrice,
  inStock,
  sort,
  order,
  ...pageParams
}: ProductQueryParams = {}): Promise<Paginated<AdminProductListItem>> {
  let qs = query(pageParams);
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (categoryId) qs += `&categoryId=${encodeURIComponent(categoryId)}`;
  if (brandId) qs += `&brandId=${encodeURIComponent(brandId)}`;
  if (status && status !== "all") qs += `&status=${status}`;
  if (isFeatured && isFeatured !== "all") qs += `&isFeatured=${isFeatured}`;
  if (typeof minPrice === "number") qs += `&minPrice=${minPrice}`;
  if (typeof maxPrice === "number") qs += `&maxPrice=${maxPrice}`;
  if (inStock === "inStock") qs += `&inStock=true`;
  else if (inStock === "outOfStock") qs += `&inStock=false`;
  if (sort) qs += `&sort=${sort}`;
  if (order) qs += `&order=${order}`;
  return apiFetch<Paginated<AdminProductListItem>>(`/admin/products${qs}`, { method: "GET" });
}

export function fetchProductDetail(id: string): Promise<{ product: AdminProductDetail }> {
  return apiFetch<{ product: AdminProductDetail }>(`/admin/products/${encodeURIComponent(id)}`, { method: "GET" });
}

export function createProduct(input: ProductFormInput): Promise<{ product: AdminProductDetail }> {
  return apiFetch<{ product: AdminProductDetail }>("/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(
  id: string,
  patch: Partial<ProductFormInput>
): Promise<{ product: AdminProductDetail }> {
  return apiFetch<{ product: AdminProductDetail }>(`/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteProduct(id: string): Promise<{ archived: boolean }> {
  return apiFetch<{ archived: boolean }>(`/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function duplicateProduct(id: string): Promise<{ product: AdminProductDetail }> {
  return apiFetch<{ product: AdminProductDetail }>(`/admin/products/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
  });
}
