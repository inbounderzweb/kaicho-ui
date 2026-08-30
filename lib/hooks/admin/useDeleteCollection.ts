import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCollection } from "../../api/collection";
import { collectionKeys } from "../query-keys";

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.list });
    },
  });
}
