import { useMutation, useQueryClient } from "@tanstack/react-query";
import { placeOrder, type PlaceOrderInput, type PlaceOrderResult } from "../api/checkout";
import { orderKeys } from "./query-keys";

// The idempotency key is supplied by the caller (CheckoutClient holds one
// in a ref for the life of the page) rather than generated here — a hook
// generating it per call would defeat the point, since every retry would
// get a fresh key and could place a duplicate order.
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: PlaceOrderInput;
      idempotencyKey: string;
    }): Promise<PlaceOrderResult> => placeOrder(input, idempotencyKey),
    onSuccess: () => {
      // A new order (even one still PENDING_PAYMENT) belongs in the
      // customer's order list immediately.
      queryClient.invalidateQueries({ queryKey: orderKeys.lists });
    },
  });
}
