import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrand, type BrandFormInput } from "../../api/brand";

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BrandFormInput) => createBrand(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "brands", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "brands", "options"] });
    },
  });
}
