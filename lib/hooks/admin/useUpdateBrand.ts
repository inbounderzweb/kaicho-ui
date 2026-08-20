import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBrand, type BrandFormInput } from "../../api/brand";
import { brandKeys } from "../query-keys";

export function useUpdateBrand(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<BrandFormInput>) => updateBrand(id, patch),
    onSuccess: (res) => {
      queryClient.setQueryData(brandKeys.detail(id), res);
      queryClient.invalidateQueries({ queryKey: ["admin", "brands", "list"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "brands", "options"] });
    },
  });
}
