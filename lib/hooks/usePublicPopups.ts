import { useQuery } from "@tanstack/react-query";
import { fetchLivePopups } from "../api/popup";
import { popupKeys } from "./query-keys";

/**
 * Live storefront popups. A short staleTime (plus the backend's 15s HTTP
 * cache) keeps pausing / expiring / editing a popup reaching visitors within
 * about a minute; `enabled` lets callers skip the request entirely.
 */
export function usePublicPopups(enabled = true) {
  return useQuery({
    queryKey: popupKeys.live,
    queryFn: async () => (await fetchLivePopups()).popups,
    enabled,
    staleTime: 60_000,
    retry: 0,
  });
}
