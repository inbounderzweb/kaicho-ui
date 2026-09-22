import { apiFetch } from "./client";
import type { PackSelectionInput } from "./checkout";

// Backed by kaicho-be's public, unauthenticated /cart/validate-pack and
// /cart/apply-pack (this app lets anonymous shoppers add to cart before
// logging in, so a pack recommendation must work pre-login too). Neither
// call reserves stock or touches an order — both are pure "what would this
// cost" reads, the same philosophy as /checkout/preview.

export interface PackRecommendationLine {
  packId: string;
  packName: string;
  packQuantity: number;
  packCount: number;
  packPrice: number;
}

export interface PackRecommendation {
  applicable: boolean;
  reason?: string;
  exactMatch?: boolean;
  breakdown?: PackRecommendationLine[];
  totalQuantity?: number;
  totalPrice?: number;
  individualTotal?: number;
  savings?: number;
}

export function validatePack(productId: string, quantity: number): Promise<PackRecommendation> {
  return apiFetch<PackRecommendation>("/cart/validate-pack", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export interface AppliedPack {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  breakdown: PackRecommendationLine[];
  availableStock: number | null;
}

export function applyPack(productId: string, packSelection: PackSelectionInput[]): Promise<AppliedPack> {
  return apiFetch<AppliedPack>("/cart/apply-pack", {
    method: "POST",
    body: JSON.stringify({ productId, packSelection }),
  });
}
