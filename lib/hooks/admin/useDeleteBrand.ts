import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBrand } from "../../api/brand";

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "brands", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "brands", "options"] });
    },
  });
}
