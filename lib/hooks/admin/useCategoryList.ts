import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCategories, type CategoryQueryParams } from "../../api/category";
import { categoryKeys } from "../query-keys";

export function useCategoryList(params: CategoryQueryParams = {}) {
  const {
    page = 1,
    pageSize = 20,
    search,
    parentId,
    isActive = "all",
    sort = "sortOrder",
    order = "asc",
  } = params;

  const normalized: CategoryQueryParams = { page, pageSize, search, parentId, isActive, sort, order };

  return useQuery({
    queryKey: categoryKeys.list(normalized),
    queryFn: () => fetchCategories(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
