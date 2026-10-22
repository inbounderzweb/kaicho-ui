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
    mutationFn: (input: { status: OrderStatus; note?: string; sendEmail?: boolean }) => updateAdminOrderStatus(id, input),
    onSuccess: (order) => {
      queryClient.setQueryData(adminKeys.orderDetail(id), order);
      // The status endpoint returns the plain order (no joined customer), so
      // refetch the full admin detail rather than leave the customer card blank.
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(id) });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", "list"] });
      // A status change moves revenue/order counts on the dashboard too.
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}
