import { useQuery } from "@tanstack/react-query";
import { fetchPublicStoreSettings } from "../api/settings";
import type { MrpDisplayMode } from "../api/product";
import { settingsKeys } from "./query-keys";

/**
 * Whether the storefront shows the struck-through MRP and "% OFF" labels.
 * The store-wide switch (admin: Settings → Price display) is the default;
 * a product's own `mrpDisplay` ("SHOW" / "HIDE") overrides it for that
 * product only. Following the store setting, it is shown only once the
 * setting has loaded as "on", so a store that hides MRP never flashes it
 * while loading.
 */
/** Applies a product's own override to an already-known store-wide value (for lists where a hook can't run per row). */
export function resolveShowMrp(mrpDisplay: MrpDisplayMode | undefined, storeShowMrp: boolean): boolean {
  if (mrpDisplay === "SHOW") return true;
  if (mrpDisplay === "HIDE") return false;
  return storeShowMrp;
}

export function useShowMrp(mrpDisplay?: MrpDisplayMode): boolean {
  const { data } = useQuery({
    queryKey: settingsKeys.public,
    queryFn: () => fetchPublicStoreSettings(),
    staleTime: 5 * 60_000,
  });
  if (mrpDisplay === "SHOW") return true;
  if (mrpDisplay === "HIDE") return false;
  // Not loaded yet → hidden. Loaded without the field (older backend) → shown.
  return data ? data.settings.showMrp !== false : false;
}
