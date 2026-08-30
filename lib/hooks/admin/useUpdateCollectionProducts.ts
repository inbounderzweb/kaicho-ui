import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCollectionProducts, type CollectionProductRef } from "../../api/collection";
import { collectionKeys } from "../query-keys";

export function useUpdateCollectionProducts(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (products: CollectionProductRef[]) => updateCollectionProducts(id, products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.list });
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(id) });
    },
  });
}
