import { useQuery } from "@tanstack/react-query";
import { fetchProductDetail } from "../../api/product";
import { productKeys } from "../query-keys";

export function useProductDetail(id: string | null) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => fetchProductDetail(id!),
    enabled: Boolean(id),
    retry: false,
  });
}
