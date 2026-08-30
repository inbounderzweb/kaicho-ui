import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCollection, type CollectionFormInput } from "../../api/collection";
import { collectionKeys } from "../query-keys";

export function useUpdateCollection(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<CollectionFormInput>) => updateCollection(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.list });
      queryClient.invalidateQueries({ queryKey: collectionKeys.detail(id) });
    },
  });
}
