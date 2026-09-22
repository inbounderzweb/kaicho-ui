import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPackConfig,
  updatePackConfig,
  fetchPacks,
  createPack,
  updatePack,
  deletePack,
  type PackConfigParent,
  type PackFormInput,
  type AdminPackConfigSettings,
} from "../../api/adminPack";
import { packConfigKeys } from "../query-keys";

// One hook module shared by the product-scoped and category-scoped Pack
// Configuration admin UI (spec §15/§16) — `parent`/`parentId` pick which
// router the underlying API client hits.

export function usePackConfig(parent: PackConfigParent, parentId: string | null) {
  return useQuery({
    queryKey: packConfigKeys.config(parent, parentId ?? "new"),
    queryFn: () => fetchPackConfig(parent, parentId as string).then((r) => r.packConfig),
    enabled: Boolean(parentId),
    staleTime: 15_000,
  });
}

export function usePackList(parent: PackConfigParent, parentId: string | null) {
  return useQuery({
    queryKey: packConfigKeys.list(parent, parentId ?? "new"),
    queryFn: () => fetchPacks(parent, parentId as string).then((r) => r.packs),
    enabled: Boolean(parentId),
    staleTime: 15_000,
  });
}

function useInvalidatePacks(parent: PackConfigParent, parentId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: packConfigKeys.list(parent, parentId) });
    queryClient.invalidateQueries({ queryKey: packConfigKeys.config(parent, parentId) });
  };
}

export function useUpdatePackConfig(parent: PackConfigParent, parentId: string) {
  const invalidate = useInvalidatePacks(parent, parentId);
  return useMutation({
    mutationFn: (patch: Partial<Pick<AdminPackConfigSettings, "enabled" | "mode" | "mixedPacksAllowed" | "recommendationStrategy">>) =>
      updatePackConfig(parent, parentId, patch),
    onSuccess: invalidate,
  });
}

export function useCreatePack(parent: PackConfigParent, parentId: string) {
  const invalidate = useInvalidatePacks(parent, parentId);
  return useMutation({
    mutationFn: (input: PackFormInput) => createPack(parent, parentId, input),
    onSuccess: invalidate,
  });
}

export function useUpdatePack(parent: PackConfigParent, parentId: string) {
  const invalidate = useInvalidatePacks(parent, parentId);
  return useMutation({
    mutationFn: ({ packId, patch }: { packId: string; patch: Partial<PackFormInput> }) =>
      updatePack(parent, parentId, packId, patch),
    onSuccess: invalidate,
  });
}

export function useDeletePack(parent: PackConfigParent, parentId: string) {
  const invalidate = useInvalidatePacks(parent, parentId);
  return useMutation({
    mutationFn: (packId: string) => deletePack(parent, parentId, packId),
    onSuccess: invalidate,
  });
}
