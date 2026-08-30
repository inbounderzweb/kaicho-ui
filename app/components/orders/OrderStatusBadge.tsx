import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/api/order";

// Storefront-side status pills. Deliberately uses the brand token set
// (--color-brand / --color-sale / --color-gold / --color-terracotta), not
// the admin panel's --color-admin-* palette, which is scoped to /admin.
const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-gold/15 text-gold",
  CONFIRMED: "bg-brand-soft text-brand",
  PROCESSING: "bg-gold/15 text-gold",
  SHIPPED: "bg-terracotta/15 text-terracotta",
  OUT_FOR_DELIVERY: "bg-terracotta/15 text-terracotta",
  DELIVERED: "bg-brand-soft text-brand",
  CANCELLED: "bg-sale/10 text-sale",
  RETURN_REQUESTED: "bg-gold/15 text-gold",
  RETURNED: "bg-sale/10 text-sale",
  REFUNDED: "bg-sale/10 text-sale",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-gold/15 text-gold",
  PAID: "bg-brand-soft text-brand",
  FAILED: "bg-sale/10 text-sale",
  REFUNDED: "bg-sale/10 text-sale",
  PARTIALLY_REFUNDED: "bg-gold/15 text-gold",
};

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`${base} ${ORDER_STATUS_STYLES[status] ?? "bg-cream text-ink-muted"}`}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`${base} ${PAYMENT_STATUS_STYLES[status] ?? "bg-cream text-ink-muted"}`}>
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}
