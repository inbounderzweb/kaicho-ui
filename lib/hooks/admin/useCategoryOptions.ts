import { useQuery } from "@tanstack/react-query";
import { fetchCategoryOptions } from "../../api/category";
import { categoryKeys } from "../query-keys";

export function useCategoryOptions() {
  return useQuery({
    queryKey: categoryKeys.options,
    queryFn: fetchCategoryOptions,
    staleTime: 60_000,
  });
}
