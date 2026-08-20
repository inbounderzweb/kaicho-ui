import { useQuery } from "@tanstack/react-query";
import { fetchPublicProductBySlug } from "../api/publicProducts";
import { publicProductKeys } from "./query-keys";
import { ApiError } from "../api/ApiError";

// Powers /products/:slug. `enabled` guards against firing with an empty
// slug during the first render of a dynamic route; retry is disabled for a
// 404 (product not found/not public) since retrying won't change the
// answer — the page component handles the 404 case (see notFound()).
export function useProduct(slug: string) {
  return useQuery({
    queryKey: publicProductKeys.detail(slug),
    queryFn: () => fetchPublicProductBySlug(slug),
    enabled: Boolean(slug),
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });
}
