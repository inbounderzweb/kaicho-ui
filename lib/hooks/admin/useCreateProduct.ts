import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct, type ProductFormInput } from "../../api/product";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductFormInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products", "list"] });
    },
  });
}
