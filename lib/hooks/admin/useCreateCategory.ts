import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory, type CategoryFormInput } from "../../api/category";

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CategoryFormInput) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories", "options"] });
    },
  });
}
