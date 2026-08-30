import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchOrders, type OrderListParams } from "../api/order";
import { orderKeys } from "./query-keys";
import { useCurrentUser } from "./useCurrentUser";

// /orders is requireAuth and scoped to the caller's own orders — gated on
// a known session, same as useWishlist/useAddresses, so a signed-out
// visitor never fires a guaranteed 401.
export function useOrders({ page = 1, pageSize = 10 }: OrderListParams = {}) {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: orderKeys.list(page, pageSize),
    queryFn: () => fetchOrders({ page, pageSize }),
    enabled: Boolean(user),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
