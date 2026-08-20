import { useQuery } from "@tanstack/react-query";
import { fetchBrandOptions } from "../../api/brand";
import { brandKeys } from "../query-keys";

export function useBrandOptions() {
  return useQuery({
    queryKey: brandKeys.options,
    queryFn: fetchBrandOptions,
    staleTime: 60_000,
  });
}
