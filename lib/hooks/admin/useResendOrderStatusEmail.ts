import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resendAdminOrderStatusEmail } from "../../api/admin";
import { adminKeys } from "../query-keys";

// Retry after "saved, but the email failed". The backend claims the send
// atomically, so clicking twice (or retrying a mail that did go out) can't
// deliver a second copy.
export function useResendOrderStatusEmail(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => resendAdminOrderStatusEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.orderDetail(id) });
    },
  });
}
