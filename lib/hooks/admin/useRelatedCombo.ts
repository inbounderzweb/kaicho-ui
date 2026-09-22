import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRelatedCombo, updateRelatedCombo, type RelatedComboMode } from "../../api/adminRelatedCombo";
import { relatedComboKeys } from "../query-keys";

export function useRelatedCombo(productId: string | null) {
  return useQuery({
    queryKey: relatedComboKeys.detail(productId ?? "new"),
    queryFn: () => fetchRelatedCombo(productId as string).then((r) => r.relatedCombo),
    enabled: Boolean(productId),
    staleTime: 15_000,
  });
}

export function useUpdateRelatedCombo(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: { mode?: RelatedComboMode; comboProductId?: string | null }) =>
      updateRelatedCombo(productId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: relatedComboKeys.detail(productId) }),
  });
}
