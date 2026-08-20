import { apiFetch } from "./client";
import type { PublicProductListItem } from "./publicProducts";

// Backed by kaicho-be's /api/wishlist (requireAuth) — built on the
// previously-unused User.wishlist field. Every response returns the full
// hydrated list (not just an id), so a mutation's result can replace the
// cached wishlist directly instead of triggering a second round trip.
export interface WishlistResult {
  items: PublicProductListItem[];
  total: number;
}

export function fetchWishlist(): Promise<WishlistResult> {
  return apiFetch<WishlistResult>("/wishlist", { method: "GET" });
}

export function addToWishlist(productId: string): Promise<WishlistResult> {
  return apiFetch<WishlistResult>(`/wishlist/${encodeURIComponent(productId)}`, { method: "POST" });
}

export function removeFromWishlist(productId: string): Promise<WishlistResult> {
  return apiFetch<WishlistResult>(`/wishlist/${encodeURIComponent(productId)}`, { method: "DELETE" });
}
