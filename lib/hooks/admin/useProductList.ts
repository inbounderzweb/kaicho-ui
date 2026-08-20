import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchProducts, type ProductQueryParams } from "../../api/product";
import { productKeys } from "../query-keys";

export function useProductList(params: ProductQueryParams = {}) {
  const {
    page = 1,
    pageSize = 20,
    search,
    categoryId,
    brandId,
    status = "all",
    isFeatured = "all",
    minPrice,
    maxPrice,
    inStock = "all",
    sort = "createdAt",
    order = "desc",
  } = params;

  const normalized: ProductQueryParams = {
    page,
    pageSize,
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
  };

  return useQuery({
    queryKey: productKeys.list(normalized),
    queryFn: () => fetchProducts(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
