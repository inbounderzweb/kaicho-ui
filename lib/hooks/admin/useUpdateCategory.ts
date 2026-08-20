import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCategory, type CategoryFormInput } from "../../api/category";
import { categoryKeys } from "../query-keys";

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<CategoryFormInput>) => updateCategory(id, patch),
    onSuccess: (res) => {
      queryClient.setQueryData(categoryKeys.detail(id), res);
      queryClient.invalidateQueries({ queryKey: ["admin", "categories", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories", "options"] });
    },
  });
}
