import { useMutation, useQueryClient } from "@tanstack/react-query";
import { refundAdminOrder } from "../../api/admin";
import { adminKeys } from "../query-keys";

// `amount` omitted means a full refund — the remaining refundable amount
// is computed server-side against what Razorpay actually captured, not
// from the order total shown in the browser.
export function useRefundOrder(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount?: number) => refundAdminOrder(id, amount),
    onSuccess: (order) => {
      queryClient.setQueryData(adminKeys.orderDetail(id), order);
      queryClient.invalidateQueries({ queryKey: ["admin", "orders", "list"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}
