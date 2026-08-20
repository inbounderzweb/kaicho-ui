import { useMutation, useQueryClient } from "@tanstack/react-query";
import { duplicateProduct } from "../../api/product";

export function useDuplicateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => duplicateProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products", "list"] });
    },
  });
}
