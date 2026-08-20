import { useQuery } from "@tanstack/react-query";
import { fetchRelatedProducts } from "../api/publicProducts";
import { publicProductKeys } from "./query-keys";

export function useRelatedProducts(slug: string, limit = 8) {
  return useQuery({
    queryKey: publicProductKeys.related(slug, limit),
    queryFn: () => fetchRelatedProducts(slug, limit),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
