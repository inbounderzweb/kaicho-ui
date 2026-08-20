import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToWishlist, removeFromWishlist, type WishlistResult } from "../api/wishlist";
import { wishlistKeys } from "./query-keys";

// One mutation, either direction — the caller (e.g. a wishlist heart
// button) already knows whether the product is currently in the list, so
// it just passes the intended next state. The API response is the full,
// authoritative wishlist, so we write it straight into the cache instead
// of re-fetching.
export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, inWishlist }: { productId: string; inWishlist: boolean }): Promise<WishlistResult> =>
      inWishlist ? removeFromWishlist(productId) : addToWishlist(productId),
    onSuccess: (result) => {
      queryClient.setQueryData(wishlistKeys.all, result);
    },
  });
}
