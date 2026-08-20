import { useQuery } from "@tanstack/react-query";
import { fetchBrandDetail } from "../../api/brand";
import { brandKeys } from "../query-keys";

export function useBrandDetail(id: string | null) {
  return useQuery({
    queryKey: brandKeys.detail(id ?? ""),
    queryFn: () => fetchBrandDetail(id!),
    enabled: Boolean(id),
    retry: false,
  });
}
