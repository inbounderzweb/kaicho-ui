import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminOrderStatus } from "../../api/admin";
import type { OrderStatus } from "../../api/order";
import { adminKeys } from "../query-keys";

// The backend validates the transition against its own state machine and
// appends the statusHistory entry (with the acting admin) — the dropdown's
// narrowed option list is UI affordance only.
export function useUpdateOrderStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { status: OrderStatus; note?: string }) => updateAdminOrderStatus(id, input),
    onSuccess: (order) => {
      queryClient.setQueryData(adminKeys.orderDetail(id), order);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", "list"] });
      // A status change moves revenue/order counts on the dashboard too.
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}
