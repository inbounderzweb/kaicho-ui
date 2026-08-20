import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCategoryProducts, type CategoryProductsParams } from "../api/publicCategories";
import { publicCategoryKeys } from "./query-keys";

// The /category/:slug product grid — same shape/behavior as useProducts,
// scoped server-side to one category via the route param rather than the
// `category` query filter.
export function useCategoryProducts(slug: string, params: CategoryProductsParams = {}) {
  const normalized: CategoryProductsParams = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 24,
    search: params.search || undefined,
    brand: params.brand || undefined,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    inStock: params.inStock || undefined,
    sort: params.sort ?? "relevance",
    order: params.order ?? "asc",
  };

  return useQuery({
    queryKey: publicCategoryKeys.products(slug, normalized),
    queryFn: () => fetchCategoryProducts(slug, normalized),
    enabled: Boolean(slug),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
