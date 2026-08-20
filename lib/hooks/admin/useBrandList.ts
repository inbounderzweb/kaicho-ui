import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchBrands, type BrandQueryParams } from "../../api/brand";
import { brandKeys } from "../query-keys";

export function useBrandList(params: BrandQueryParams = {}) {
  const {
    page = 1,
    pageSize = 20,
    search,
    isActive = "all",
    sort = "sortOrder",
    order = "asc",
  } = params;

  const normalized: BrandQueryParams = { page, pageSize, search, isActive, sort, order };

  return useQuery({
    queryKey: brandKeys.list(normalized),
    queryFn: () => fetchBrands(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
