import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/ApiError";
import { startOrderPayment, type Order } from "../api/order";
import { loadRazorpayScript } from "../payments/loadRazorpayScript";
import { orderKeys } from "./query-keys";
import { useCurrentUser } from "./useCurrentUser";
import { useVerifyPayment } from "./useVerifyPayment";

// "Pay now" for an order that is still PENDING_PAYMENT — the customer closed
// the Razorpay window, the attempt failed, or they came back later. Re-opens
// Razorpay against the SAME gateway order (the server hands it back after
// re-checking eligibility), so a customer can never be charged twice for one
// order. The verify call / webhook settle the order exactly as at checkout.
export function usePayPendingOrder() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const verifyPayment = useVerifyPayment();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Re-entrancy guard that works across the async gap before the state
  // update lands — a double-click must not open two modals.
  const busy = useRef(false);

  const refreshOrder = useCallback(
    (orderNumber: string) => queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderNumber) }),
    [queryClient]
  );

  const pay = useCallback(
    async (order: Pick<Order, "orderNumber">) => {
      if (busy.current) return;
      busy.current = true;
      setError(null);
      setIsPaying(true);
      const done = () => {
        busy.current = false;
        setIsPaying(false);
      };

      try {
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKey) throw new Error("Online payment isn't configured right now. Please try again later.");

        const result = await startOrderPayment(order.orderNumber);
        if (result.alreadyPaid || !result.razorpayOrder) {
          // Settled while the customer was away — just show the paid order.
          queryClient.setQueryData(orderKeys.detail(result.order.orderNumber), result.order);
          queryClient.invalidateQueries({ queryKey: orderKeys.lists });
          done();
          return;
        }

        await loadRazorpayScript();
        const Razorpay = window.Razorpay;
        if (!Razorpay) throw new Error("Couldn't load the payment gateway. Please try again.");
        const razorpayOrder = result.razorpayOrder;

        const checkout = new Razorpay({
          key: razorpayKey,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          order_id: razorpayOrder.id,
          name: "Kaicho Foods",
          description: `Order ${result.order.orderNumber}`,
          prefill: {
            name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || undefined,
            email: user?.email,
            contact: user?.phone ? `${user.countryCode}${user.phone}` : undefined,
          },
          theme: { color: "#00a861" },
          handler: (response) => {
            verifyPayment.mutate(
              {
                orderId: result.order.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              {
                onSettled: () => {
                  // On success the cache already holds the confirmed order. On
                  // failure the webhook still settles it, so refetch rather
                  // than telling the customer the payment failed.
                  void refreshOrder(result.order.orderNumber);
                  done();
                },
              }
            );
          },
          modal: {
            ondismiss: () => {
              setError("Payment wasn't completed. You can try again while your order is still being held.");
              void refreshOrder(result.order.orderNumber);
              done();
            },
          },
        });
        checkout.open();
      } catch (err) {
        setError(
          err instanceof ApiError || err instanceof Error ? err.message : "Couldn't start the payment. Please try again."
        );
        // The order may have expired or been settled meanwhile — show its true state.
        void refreshOrder(order.orderNumber);
        done();
      }
    },
    [queryClient, refreshOrder, user, verifyPayment]
  );

  return { pay, isPaying, error, clearError: () => setError(null) };
}
