import { useQuery } from "@tanstack/react-query";
import { fetchPublicBrands } from "../api/publicBrands";
import { publicBrandKeys } from "./query-keys";

export function usePublicBrands() {
  return useQuery({
    queryKey: publicBrandKeys.list,
    queryFn: fetchPublicBrands,
    staleTime: 5 * 60_000,
  });
}
