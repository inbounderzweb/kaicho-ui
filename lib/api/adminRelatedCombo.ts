import { apiFetch } from "./client";

// Backed by kaicho-be's /admin/products/:id/related-combo — see
// relatedCombo.service.ts for the AUTO/MANUAL/NONE resolution this governs.
export const RELATED_COMBO_MODES = ["AUTO", "MANUAL", "NONE"] as const;
export type RelatedComboMode = (typeof RELATED_COMBO_MODES)[number];

export interface AdminRelatedCombo {
  mode: RelatedComboMode;
  comboProductId?: string;
  /** Display convenience only. */
  comboProductName?: string;
}

function base(productId: string): string {
  return `/admin/products/${encodeURIComponent(productId)}/related-combo`;
}

export function fetchRelatedCombo(productId: string): Promise<{ relatedCombo: AdminRelatedCombo }> {
  return apiFetch(base(productId), { method: "GET" });
}

export function updateRelatedCombo(
  productId: string,
  patch: { mode?: RelatedComboMode; comboProductId?: string | null }
): Promise<{ relatedCombo: AdminRelatedCombo }> {
  return apiFetch(base(productId), {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
