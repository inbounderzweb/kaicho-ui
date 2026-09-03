import { apiFetch, type PublicReadOptions } from "./client";

// Separate, deliberately smaller DTO shapes than lib/api/product.ts (the
// admin CRUD client) — this file talks to the unauthenticated /products,
// /products/:slug, /products/:slug/related public routes, never /admin/*.
// No costPrice, no raw status enum, no createdBy/updatedBy — see
// kaicho-be's product.service.ts "Public catalog" section, which this
// mirrors field-for-field.

export interface PublicProductImage {
  mediaId: string;
  url: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  altText: string;
}

export interface PublicProductPricing {
  mrp: number;
  sellingPrice: number;
  discountPercentage: number;
}

export interface PublicProductInventory {
  inStock: boolean;
  stockQuantity: number;
  lowStock: boolean;
  /** Whether this product's stock is tracked at all — when false,
   *  stockQuantity isn't meaningful and must not gate quantity selectors. */
  trackInventory: boolean;
}

export interface PublicProductCategoryRef {
  categoryId: string;
  name: string;
  slug: string;
}

export interface PublicProductBrandRef {
  brandId: string;
  name: string;
  slug: string;
}

export interface PublicProductListItem {
  productId: string;
  name: string;
  slug: string;
  shortDescription: string;
  category: PublicProductCategoryRef | null;
  brand: PublicProductBrandRef | null;
  image: PublicProductImage | null;
  pricing: PublicProductPricing;
  inventory: PublicProductInventory;
}

export interface PublicProductSeo {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export interface PublicProductDetail {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  category: PublicProductCategoryRef | null;
  brand: PublicProductBrandRef | null;
  images: PublicProductImage[];
  pricing: PublicProductPricing;
  inventory: PublicProductInventory;
  seo: PublicProductSeo;
}

export const PUBLIC_SORT_FIELDS = ["relevance", "price", "name", "createdAt"] as const;
export type PublicSortField = (typeof PUBLIC_SORT_FIELDS)[number];
export type PublicSortOrder = "asc" | "desc";

export interface PublicProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** category SLUG, not id — the public API is slug-first end to end */
  category?: string;
  /** brand SLUG, not id */
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: PublicSortField;
  order?: PublicSortOrder;
}

export interface PublicProductListResult {
  items: PublicProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  sort: PublicSortField;
  order: PublicSortOrder;
}

// Shared with publicCategories.ts's fetchCategoryProducts (same query
// param names, `category` just omitted there since it's pinned by route
// param instead) — one place building the querystring, not two.
export function buildProductQueryString(params: PublicProductListParams): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.search) qs.set("search", params.search);
  if (params.category) qs.set("category", params.category);
  if (params.brand) qs.set("brand", params.brand);
  if (typeof params.minPrice === "number" && !Number.isNaN(params.minPrice)) {
    qs.set("minPrice", String(params.minPrice));
  }
  if (typeof params.maxPrice === "number" && !Number.isNaN(params.maxPrice)) {
    qs.set("maxPrice", String(params.maxPrice));
  }
  if (params.inStock) qs.set("inStock", "true");
  if (params.sort) qs.set("sort", params.sort);
  if (params.order) qs.set("order", params.order);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function fetchPublicProducts(
  params: PublicProductListParams = {},
  opts?: PublicReadOptions
): Promise<PublicProductListResult> {
  return apiFetch<PublicProductListResult>(`/products${buildProductQueryString(params)}`, {
    method: "GET",
    ...opts,
  });
}

export function fetchPublicProductBySlug(
  slug: string,
  opts?: PublicReadOptions
): Promise<{ product: PublicProductDetail }> {
  return apiFetch<{ product: PublicProductDetail }>(`/products/${encodeURIComponent(slug)}`, {
    method: "GET",
    ...opts,
  });
}

export function fetchRelatedProducts(
  slug: string,
  limit = 8,
  opts?: PublicReadOptions
): Promise<{ products: PublicProductListItem[] }> {
  return apiFetch<{ products: PublicProductListItem[] }>(
    `/products/${encodeURIComponent(slug)}/related?limit=${limit}`,
    { method: "GET", ...opts }
  );
}
