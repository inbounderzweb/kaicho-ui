import { useQuery } from "@tanstack/react-query";
import { fetchCollections } from "../../api/collection";
import { collectionKeys } from "../query-keys";

export function useCollectionList() {
  return useQuery({
    queryKey: collectionKeys.list,
    queryFn: fetchCollections,
    staleTime: 30_000,
  });
}
