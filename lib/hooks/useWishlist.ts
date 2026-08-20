import { useQuery } from "@tanstack/react-query";
import { fetchWishlist } from "../api/wishlist";
import { wishlistKeys } from "./query-keys";
import { useCurrentUser } from "./useCurrentUser";

// Wishlist is always per-logged-in-user (see wishlist.routes.ts — every
// route is requireAuth), so this only fires once we know there's a
// session; a signed-out visitor gets an empty list without ever hitting
// the API and getting a 401.
export function useWishlist() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: wishlistKeys.all,
    queryFn: fetchWishlist,
    enabled: Boolean(user),
    staleTime: 30_000,
  });
}
