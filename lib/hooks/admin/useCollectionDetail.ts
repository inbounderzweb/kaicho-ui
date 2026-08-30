import { useQuery } from "@tanstack/react-query";
import { fetchCollectionDetail } from "../../api/collection";
import { collectionKeys } from "../query-keys";

export function useCollectionDetail(id: string | null) {
  return useQuery({
    queryKey: collectionKeys.detail(id ?? ""),
    queryFn: () => fetchCollectionDetail(id!),
    enabled: Boolean(id),
    retry: false,
  });
}
