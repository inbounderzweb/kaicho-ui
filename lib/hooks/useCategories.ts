import { useQuery } from "@tanstack/react-query";
import { fetchPublicCategories } from "../api/publicCategories";
import { publicCategoryKeys } from "./query-keys";

// The active-category list — powers the category filter chips/dropdown on
// /products and any category nav. Rarely changes, so a long staleTime is
// safe (an admin publishing a new category doesn't need this to be
// second-fresh).
export function useCategories() {
  return useQuery({
    queryKey: publicCategoryKeys.list,
    queryFn: fetchPublicCategories,
    staleTime: 5 * 60_000,
  });
}
