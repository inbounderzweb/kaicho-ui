import { useQuery } from "@tanstack/react-query";
import { fetchPublicStoreSettings } from "../api/settings";
import { settingsKeys } from "./query-keys";

/**
 * Whether the storefront shows the struck-through MRP and "% OFF" labels
 * (admin: Settings → Price display). Shown only once the setting has loaded
 * as "on", so a store that hides MRP never flashes it while loading.
 */
export function useShowMrp(): boolean {
  const { data } = useQuery({
    queryKey: settingsKeys.public,
    queryFn: () => fetchPublicStoreSettings(),
    staleTime: 5 * 60_000,
  });
  // Not loaded yet → hidden. Loaded without the field (older backend) → shown.
  return data ? data.settings.showMrp !== false : false;
}
