import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOffers,
  fetchOfferDetail,
  fetchOfferUsages,
  createOffer,
  updateOffer,
  setOfferStatus,
  simulateOffer,
  type OfferQueryParams,
  type OfferFormPayload,
  type FreeSelectionInput,
} from "../../api/offer";
import { offerKeys } from "../query-keys";

export function useOfferList(params: OfferQueryParams = {}) {
  const { page = 1, pageSize = 20, search, status = "all", sort = "createdAt", order = "desc" } = params;
  const normalized: OfferQueryParams = { page, pageSize, search, status, sort, order };

  return useQuery({
    queryKey: offerKeys.list(normalized),
    queryFn: () => fetchOffers(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useOfferDetail(id: string | null) {
  return useQuery({
    queryKey: offerKeys.detail(id ?? "new"),
    queryFn: () => fetchOfferDetail(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useOfferUsages(id: string, page: number, pageSize: number) {
  return useQuery({
    queryKey: offerKeys.usages(id, page, pageSize),
    queryFn: () => fetchOfferUsages(id, { page, pageSize }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateOffers() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] }),
      // The storefront badge list is derived from the same data.
      queryClient.invalidateQueries({ queryKey: ["offers"] }),
    ]);
}

export function useCreateOffer() {
  const invalidate = useInvalidateOffers();
  return useMutation({ mutationFn: (payload: OfferFormPayload) => createOffer(payload), onSuccess: invalidate });
}

export function useUpdateOffer(id: string) {
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: (patch: Partial<OfferFormPayload>) => updateOffer(id, patch),
    onSuccess: invalidate,
  });
}

export function useSetOfferStatus(id: string) {
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: (status: "ACTIVE" | "DISABLED") => setOfferStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useSimulateOffer(id: string) {
  return useMutation({
    mutationFn: (args: { items: { productId: string; quantity: number }[]; freeSelections?: FreeSelectionInput[] }) =>
      simulateOffer(id, args.items, args.freeSelections),
  });
}
