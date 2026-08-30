import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/api/order";

// Order/payment enums get their own badge rather than reusing StatusBadge:
// that one keys off human-readable display strings ("Delivered", "In
// stock") shared with products, whereas these are backend enum values that
// need both a label and a semantic colour. Same colour vocabulary as
// StatusBadge (semantic, deliberately not the admin accent hue) so the two
// don't look like different systems side by side.
const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  CONFIRMED: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  PROCESSING: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  SHIPPED: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  OUT_FOR_DELIVERY: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-700 dark:text-red-400",
  RETURN_REQUESTED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  RETURNED: "bg-red-500/15 text-red-700 dark:text-red-400",
  REFUNDED: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  PAID: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  FAILED: "bg-red-500/15 text-red-700 dark:text-red-400",
  REFUNDED: "bg-red-500/15 text-red-700 dark:text-red-400",
  PARTIALLY_REFUNDED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
const fallback = "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`${base} ${ORDER_STATUS_STYLES[status] ?? fallback}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`${base} ${PAYMENT_STATUS_STYLES[status] ?? fallback}`}>
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}
