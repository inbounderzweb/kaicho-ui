import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyRazorpayPayment, type VerifyPaymentInput } from "../api/payment";
import { orderKeys } from "./query-keys";

// Called from the Razorpay Checkout.js success handler. This is the fast
// path for updating the UI; the Razorpay webhook is the authoritative one
// and will settle the order even if this call never lands (closed tab,
// dropped connection), so a failure here means "couldn't confirm yet",
// not "payment failed".
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyPaymentInput) => verifyRazorpayPayment(input),
    onSuccess: ({ order }) => {
      queryClient.setQueryData(orderKeys.detail(order.orderNumber), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists });
    },
  });
}
