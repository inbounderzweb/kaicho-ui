import { useQuery } from "@tanstack/react-query";
import { fetchPublicStoreSettings, DEFAULT_STORE_SETTINGS } from "../api/settings";
import { settingsKeys } from "./query-keys";

/**
 * The storefront's live shipping policy (admin-configurable). Falls back to
 * DEFAULT_STORE_SETTINGS until the fetch resolves and if it ever fails, so
 * callers can use the numbers unconditionally.
 */
export function useShippingPolicy() {
  const { data } = useQuery({
    queryKey: settingsKeys.public,
    queryFn: () => fetchPublicStoreSettings(),
    staleTime: 5 * 60_000,
  });

  return {
    freeShippingThreshold:
      data?.settings.freeShippingThreshold ?? DEFAULT_STORE_SETTINGS.freeShippingThreshold,
    flatShippingFee: data?.settings.flatShippingFee ?? DEFAULT_STORE_SETTINGS.flatShippingFee,
  };
}
