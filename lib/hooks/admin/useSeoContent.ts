import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSeoPages,
  fetchSeoEntities,
  fetchAdminPageContent,
  saveAdminPageContent,
  type EntityPageKey,
  type PageKey,
  type SavePageContentPayload,
} from "../../api/seoContent";
import { seoKeys } from "../query-keys";

export function useSeoPages() {
  return useQuery({ queryKey: seoKeys.pages, queryFn: fetchSeoPages, staleTime: 15_000 });
}

export function useSeoEntities(pageType: EntityPageKey, search: string) {
  return useQuery({
    queryKey: seoKeys.entities(pageType, search),
    queryFn: () => fetchSeoEntities(pageType, search || undefined),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminPageContent(pageType: PageKey, entityId: string | null) {
  return useQuery({
    queryKey: seoKeys.content(pageType, entityId),
    queryFn: () => fetchAdminPageContent(pageType, entityId),
    staleTime: 0,
  });
}

export function useSavePageContent(pageType: PageKey, entityId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SavePageContentPayload) => saveAdminPageContent(pageType, entityId, payload),
    onSuccess: (data) => {
      qc.setQueryData(seoKeys.content(pageType, entityId), data);
      qc.invalidateQueries({ queryKey: seoKeys.all });
    },
  });
}
