import { apiFetch, type PublicReadOptions } from "./client";
import { buildProductQueryString, type PublicProductListParams, type PublicProductListResult } from "./publicProducts";

export interface PublicCategoryImage {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
}

export interface PublicCategory {
  categoryId: string;
  name: string;
  collectionName: string | null;
  slug: string;
  description: string | null;
  image: PublicCategoryImage | null;
}

export function fetchPublicCategories(opts?: PublicReadOptions): Promise<{ categories: PublicCategory[] }> {
  return apiFetch<{ categories: PublicCategory[] }>("/categories", { method: "GET", ...opts });
}

export function fetchPublicCategoryBySlug(
  slug: string,
  opts?: PublicReadOptions
): Promise<{ category: PublicCategory }> {
  return apiFetch<{ category: PublicCategory }>(`/categories/${encodeURIComponent(slug)}`, {
    method: "GET",
    ...opts,
  });
}

// The category landing page's product grid — same query params as
// fetchPublicProducts minus `category` (pinned by the route/slug param
// instead), delegating straight to the same /products query-building logic
// rather than a parallel implementation.
export type CategoryProductsParams = Omit<PublicProductListParams, "category">;

export function fetchCategoryProducts(
  slug: string,
  params: CategoryProductsParams = {},
  opts?: PublicReadOptions
): Promise<PublicProductListResult> {
  return apiFetch<PublicProductListResult>(
    `/categories/${encodeURIComponent(slug)}/products${buildProductQueryString(params)}`,
    { method: "GET", ...opts }
  );
}
