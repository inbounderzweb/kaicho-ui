import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchInventoryTracking, updateInventoryTracking, type AdminInventoryTracking } from "../../api/adminInventoryTracking";
import { inventoryTrackingKeys } from "../query-keys";

// Product-level inventory tracking (governs a PLAIN purchase of the
// product — a specific pack's own override lives in usePacks.ts instead).

export function useInventoryTracking(productId: string | null) {
  return useQuery({
    queryKey: inventoryTrackingKeys.detail(productId ?? "new"),
    queryFn: () => fetchInventoryTracking(productId as string).then((r) => r.inventoryTracking),
    enabled: Boolean(productId),
    staleTime: 15_000,
  });
}

export function useUpdateInventoryTracking(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AdminInventoryTracking>) => updateInventoryTracking(productId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoryTrackingKeys.detail(productId) }),
  });
}
