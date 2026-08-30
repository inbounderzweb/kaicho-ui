import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCollection, type CollectionFormInput } from "../../api/collection";
import { collectionKeys } from "../query-keys";

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CollectionFormInput) => createCollection(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.list });
    },
  });
}
