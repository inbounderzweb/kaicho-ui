import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPopups,
  fetchPopup,
  createPopup,
  updatePopup,
  setPopupStatus,
  deletePopup,
  type PopupQueryParams,
  type PopupFormPayload,
  type PopupStatus,
} from "../../api/popup";
import { popupKeys } from "../query-keys";

export function usePopupList(params: PopupQueryParams = {}) {
  const { page = 1, pageSize = 20, search, status = "all" } = params;
  const normalized: PopupQueryParams = { page, pageSize, search, status };
  return useQuery({
    queryKey: popupKeys.list(normalized),
    queryFn: () => fetchPopups(normalized),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function usePopupDetail(id: string | null) {
  return useQuery({
    queryKey: popupKeys.detail(id ?? "new"),
    queryFn: () => fetchPopup(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

// Every write refreshes the admin lists AND the storefront's live-popup cache
// (so an admin who opens the site in the same browser sees the change at once;
// other visitors pick it up within the backend's 15s cache + 60s client stale
// window).
function useInvalidate() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "popups"] }),
      queryClient.invalidateQueries({ queryKey: popupKeys.live }),
    ]);
}

export function useCreatePopup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: PopupFormPayload) => createPopup(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePopup(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (patch: Partial<PopupFormPayload>) => updatePopup(id, patch),
    onSuccess: invalidate,
  });
}

export function useSetPopupStatus(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (status: PopupStatus) => setPopupStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeletePopup() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deletePopup(id),
    onSuccess: invalidate,
  });
}
