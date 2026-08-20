import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProduct, type ProductFormInput } from "../../api/product";
import { productKeys } from "../query-keys";

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<ProductFormInput>) => updateProduct(id, patch),
    onSuccess: (res) => {
      queryClient.setQueryData(productKeys.detail(id), res);
      queryClient.invalidateQueries({ queryKey: ["admin", "products", "list"] });
    },
  });
}
