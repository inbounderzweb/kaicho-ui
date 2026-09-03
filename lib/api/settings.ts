import { apiFetch } from "./client";

export interface StoreSettings {
  freeShippingThreshold: number;
  flatShippingFee: number;
  updatedAt: string;
}

export interface StoreSettingsFormInput {
  freeShippingThreshold: number;
  flatShippingFee: number;
}

// Storefront fallback — used until the public fetch resolves and if it ever
// fails, so the cart's "add ₹X more" nudge always has sane numbers. Kept in
// sync with the backend's STORE_SETTINGS_DEFAULTS.
export const DEFAULT_STORE_SETTINGS: StoreSettingsFormInput = {
  freeShippingThreshold: 499,
  flatShippingFee: 49,
};

// Admin: the full settings document. Wrapped as { settings } to match every
// other single-entity admin controller in the codebase.
export function fetchStoreSettings(): Promise<{ settings: StoreSettings }> {
  return apiFetch<{ settings: StoreSettings }>("/admin/settings", { method: "GET" });
}

export function updateStoreSettings(
  patch: Partial<StoreSettingsFormInput>
): Promise<{ settings: StoreSettings }> {
  return apiFetch<{ settings: StoreSettings }>("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// Public, unauthenticated — same shape, used by the storefront cart.
export function fetchPublicStoreSettings(): Promise<{ settings: StoreSettings }> {
  return apiFetch<{ settings: StoreSettings }>("/settings", { method: "GET" });
}
