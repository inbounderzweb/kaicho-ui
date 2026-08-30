import { useQuery } from "@tanstack/react-query";
import { fetchAddresses } from "../api/address";
import { addressKeys } from "./query-keys";
import { useCurrentUser } from "./useCurrentUser";

// /addresses is requireAuth-only (same as the wishlist), so this stays
// disabled until we know there's a session rather than firing a guaranteed
// 401 for a signed-out visitor.
export function useAddresses() {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: addressKeys.all,
    queryFn: fetchAddresses,
    enabled: Boolean(user),
    staleTime: 60_000,
  });
}
