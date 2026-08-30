import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, type Order } from "../api/order";
import { orderKeys } from "./query-keys";

// Cancelling restores stock server-side and is only accepted from a few
// statuses (see CANCELLABLE_STATUSES) — the button is hidden otherwise,
// but the backend's transition table is the actual enforcement. The
// response is the updated order, so the detail cache is written directly
// and only the list pages are invalidated.
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderNumber, reason }: { orderNumber: string; reason?: string }): Promise<Order> =>
      cancelOrder(orderNumber, reason),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.orderNumber), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists });
    },
  });
}
