import { apiFetch } from "./client";

// Backed by kaicho-be's /admin/products/:id/related-combo — see
// relatedCombo.service.ts for the AUTO/MANUAL/NONE resolution this governs.
export const RELATED_COMBO_MODES = ["AUTO", "MANUAL", "NONE"] as const;
export type RelatedComboMode = (typeof RELATED_COMBO_MODES)[number];

export interface AdminPinnedCombo {
  comboProductId: string;
  comboProductName?: string;
  /** Why customers are not being offered this pinned bundle, if they aren't. */
  issue?: string;
}

export interface AdminRelatedCombo {
  mode: RelatedComboMode;
  /** Every pinned bundle, in order. */
  combos: AdminPinnedCombo[];
  /** Set when MANUAL has nothing pinned. */
  pinnedIssue?: string;
}

export const MAX_PINNED_COMBOS = 4;

export type RelatedComboPatch = { mode?: RelatedComboMode; comboProductIds?: string[] };

function base(productId: string): string {
  return `/admin/products/${encodeURIComponent(productId)}/related-combo`;
}

export function fetchRelatedCombo(productId: string): Promise<{ relatedCombo: AdminRelatedCombo }> {
  return apiFetch(base(productId), { method: "GET" });
}

export function updateRelatedCombo(
  productId: string,
  patch: RelatedComboPatch
): Promise<{ relatedCombo: AdminRelatedCombo }> {
  return apiFetch(base(productId), {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
