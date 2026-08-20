import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategory } from "../../api/category";

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories", "options"] });
    },
  });
}
