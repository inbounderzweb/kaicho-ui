import { apiFetch } from "./client";

// Backed by kaicho-be's /admin/products/:id/packs and the identically-shaped
// /admin/categories/:id/packs (spec §15/§16 — same schema/service code on
// the backend, just a different parent). `parent` picks which admin router
// to call so this one client file covers both surfaces.
export type PackConfigParent = "products" | "categories";

export const PACK_RECOMMENDATION_STRATEGIES = [
  "CHEAPEST",
  "LARGEST_FIRST",
  "SMALLEST_FIRST",
  "ADMIN_PRIORITY",
  "MANUAL_ONLY",
] as const;
export type PackRecommendationStrategy = (typeof PACK_RECOMMENDATION_STRATEGIES)[number];

export const PACK_CONFIG_MODES = ["CUSTOM", "INHERIT_CATEGORY"] as const;
export type PackConfigMode = (typeof PACK_CONFIG_MODES)[number];

/** A component of an admin's inventory bill-of-materials — always references an existing product, never a duplicate stock record. */
export interface InventoryComponentInput {
  productId: string;
  quantity: number;
}

export interface AdminPack {
  packId: string;
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  /** Only present on the product-scoped endpoint — derived, see backend's PackConfig.schema.ts. */
  discount?: number;
  discountPercentage?: number;
  availableStock?: number;
  /** Component-based inventory override for this specific pack — absent/false falls back to consuming `quantity` units of its own parent product (today's behaviour). */
  useComponentInventory: boolean;
  inventoryComponents: InventoryComponentInput[];
}

export interface AdminPackConfigSettings {
  enabled: boolean;
  /** Only present on the product-scoped endpoint — a category IS an inheritance source, it can't itself inherit. */
  mode?: PackConfigMode;
  mixedPacksAllowed: boolean;
  recommendationStrategy: PackRecommendationStrategy;
}

export interface PackFormInput {
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
  useComponentInventory?: boolean;
  inventoryComponents?: InventoryComponentInput[];
}

function base(parent: PackConfigParent, parentId: string): string {
  return `/admin/${parent}/${encodeURIComponent(parentId)}`;
}

export function fetchPackConfig(parent: PackConfigParent, parentId: string): Promise<{ packConfig: AdminPackConfigSettings }> {
  return apiFetch(`${base(parent, parentId)}/pack-config`, { method: "GET" });
}

export function updatePackConfig(
  parent: PackConfigParent,
  parentId: string,
  patch: Partial<Pick<AdminPackConfigSettings, "enabled" | "mode" | "mixedPacksAllowed" | "recommendationStrategy">>
): Promise<{ packConfig: AdminPackConfigSettings }> {
  return apiFetch(`${base(parent, parentId)}/pack-config`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function fetchPacks(parent: PackConfigParent, parentId: string): Promise<{ packs: AdminPack[] }> {
  return apiFetch(`${base(parent, parentId)}/packs`, { method: "GET" });
}

export function createPack(parent: PackConfigParent, parentId: string, input: PackFormInput): Promise<{ pack: AdminPack }> {
  return apiFetch(`${base(parent, parentId)}/packs`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePack(
  parent: PackConfigParent,
  parentId: string,
  packId: string,
  patch: Partial<PackFormInput>
): Promise<{ pack: AdminPack }> {
  return apiFetch(`${base(parent, parentId)}/packs/${encodeURIComponent(packId)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function deletePack(parent: PackConfigParent, parentId: string, packId: string): Promise<null> {
  return apiFetch(`${base(parent, parentId)}/packs/${encodeURIComponent(packId)}`, { method: "DELETE" });
}
