import { useQuery } from "@tanstack/react-query";
import { fetchPublicCategoryBySlug } from "../api/publicCategories";
import { publicCategoryKeys } from "./query-keys";
import { ApiError } from "../api/ApiError";

// Powers /category/:slug's header (name/description/image). The product
// grid on that same page uses useCategoryProducts below, kept separate so
// the category header can render/cache independently of filter changes.
export function useCategory(slug: string) {
  return useQuery({
    queryKey: publicCategoryKeys.detail(slug),
    queryFn: () => fetchPublicCategoryBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });
}
