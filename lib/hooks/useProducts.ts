import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchPublicProducts, type PublicProductListParams } from "../api/publicProducts";
import { publicProductKeys } from "./query-keys";

// Powers the /products listing page. keepPreviousData means paging/sorting
// doesn't flash an empty/loading grid — the previous page's items stay
// visible (dimmed by the caller, if desired) until the new page resolves.
export function useProducts(params: PublicProductListParams = {}) {
  const normalized: PublicProductListParams = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 24,
    search: params.search || undefined,
    category: params.category || undefined,
    brand: params.brand || undefined,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    inStock: params.inStock || undefined,
    sort: params.sort ?? "relevance",
    order: params.order ?? "asc",
  };

  return useQuery({
    queryKey: publicProductKeys.list(normalized),
    queryFn: () => fetchPublicProducts(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
