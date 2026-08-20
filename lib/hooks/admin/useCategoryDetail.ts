import { useQuery } from "@tanstack/react-query";
import { fetchCategoryDetail } from "../../api/category";
import { categoryKeys } from "../query-keys";

export function useCategoryDetail(id: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(id ?? ""),
    queryFn: () => fetchCategoryDetail(id!),
    enabled: Boolean(id),
    retry: false,
  });
}
