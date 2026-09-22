import { apiFetch } from "./client";
import type { InventoryComponentInput } from "./adminPack";

// Backed by kaicho-be's /admin/products/:id/inventory-tracking — governs
// what a PLAIN purchase of this product deducts (as opposed to a specific
// pack's own useComponentInventory override, see adminPack.ts). This is
// what turns a product listing into a "combo": enable it and its own
// individual-purchase quantity deducts these components instead of its own
// stock counter.
export interface AdminInventoryTracking {
  enabled: boolean;
  components: InventoryComponentInput[];
}

function base(productId: string): string {
  return `/admin/products/${encodeURIComponent(productId)}/inventory-tracking`;
}

export function fetchInventoryTracking(productId: string): Promise<{ inventoryTracking: AdminInventoryTracking }> {
  return apiFetch(base(productId), { method: "GET" });
}

export function updateInventoryTracking(
  productId: string,
  patch: Partial<AdminInventoryTracking>
): Promise<{ inventoryTracking: AdminInventoryTracking }> {
  return apiFetch(base(productId), {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
