"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconClock } from "../ui/icons";
import { usePayPendingOrder } from "@/lib/hooks/usePayPendingOrder";
import { formatCountdown, useSecondsLeft } from "@/lib/hooks/useSecondsLeft";
import { orderKeys } from "@/lib/hooks/query-keys";
import type { Order } from "@/lib/api/order";

// Compact "[ ⏱ 24:10 ] [ Pay now ]" control for an order that is still waiting
// for online payment. Used on the order page and in the order list so both
// behave the same: it renders nothing unless the order can actually be paid,
// counts down to the server-provided cut-off (`payBy`), and when that passes it
// disappears and refreshes the order data (the server decides what's next).
export default function PayNowControl({
  order,
  showAmount = false,
  showTimer = true,
  block = false,
  onBusyChange,
}: {
  order: Pick<Order, "orderNumber" | "status" | "paymentMethod" | "payBy" | "pricing">;
  /** "Pay Rs. 239.00" instead of "Pay now" — for the roomier order page. */
  showAmount?: boolean;
  showTimer?: boolean;
  /** Full-width button sized exactly like the "Cancel order" button (order page). */
  block?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const payment = usePayPendingOrder();
  const secondsLeft = useSecondsLeft(order.payBy);
  const payable =
    order.status === "PENDING_PAYMENT" && order.paymentMethod === "RAZORPAY" && Boolean(order.payBy);
  const open = payable && secondsLeft > 0;
  const expired = payable && secondsLeft === 0;

  useEffect(() => {
    if (!expired) return;
    void queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.orderNumber) });
    void queryClient.invalidateQueries({ queryKey: orderKeys.lists });
  }, [expired, queryClient, order.orderNumber]);

  useEffect(() => {
    onBusyChange?.(payment.isPaying);
  }, [payment.isPaying, onBusyChange]);

  if (!open) return null;

  const label = payment.isPaying
    ? "Opening…"
    : showAmount
      ? `Pay Rs. ${order.pricing.grandTotal.toFixed(2)}`
      : "Pay now";

  if (block) {
    // Same box as the Cancel button (w-full, px-5 py-2.5, text-sm, 1px border)
    // so the two stack as a matched pair.
    return (
      <div className="w-full">
        <button
          type="button"
          disabled={payment.isPaying}
          onClick={() => void payment.pay(order)}
          className="w-full rounded-full border border-brand bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark active:bg-brand-darker disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {label}
        </button>
        {payment.error && (
          <p role="alert" className="mt-2 text-center text-xs font-semibold text-sale">
            {payment.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {showTimer && (
          <span
            title="Time left to complete payment"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-gold/15 px-2.5 text-xs font-bold tabular-nums text-gold"
          >
            <IconClock aria-hidden="true" className="h-3.5 w-3.5" />
            {formatCountdown(secondsLeft)}
          </span>
        )}
        <button
          type="button"
          disabled={payment.isPaying}
          onClick={() => void payment.pay(order)}
          className="inline-flex h-8 items-center justify-center rounded-full bg-brand px-4 text-xs font-semibold text-white shadow-sm shadow-brand/20 transition-colors hover:bg-brand-dark active:bg-brand-darker disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {label}
        </button>
      </div>
      {payment.error && (
        <p role="alert" className="max-w-xs text-right text-xs font-semibold text-sale">
          {payment.error}
        </p>
      )}
    </div>
  );
}
