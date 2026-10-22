import { useQuery } from "@tanstack/react-query";
import { fetchPublicStoreSettings } from "../api/settings";
import { isStateDeliverable, notServedMessage, type DeliveryAreaPolicy } from "../api/deliveryArea";
import { settingsKeys } from "./query-keys";

/**
 * The store's delivery areas (admin-configurable). Until the settings load, or
 * if they fail to, nothing is blocked client-side; the server still enforces
 * the real rule at checkout.
 */
export function useDeliveryArea() {
  const { data } = useQuery({
    queryKey: settingsKeys.public,
    queryFn: () => fetchPublicStoreSettings(),
    staleTime: 5 * 60_000,
  });
  const policy: DeliveryAreaPolicy = {
    restrictDeliveryToStates: data?.settings.restrictDeliveryToStates === true,
    serviceableStates: data?.settings.serviceableStates ?? [],
  };
  return {
    restricted: policy.restrictDeliveryToStates,
    isServed: (state: string | null | undefined) => isStateDeliverable(state, policy),
    messageFor: (state: string | null | undefined) => notServedMessage(state, policy),
  };
}
