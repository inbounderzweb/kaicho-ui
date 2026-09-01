import { apiFetch } from "./client";

// Backed by kaicho-be's /api/orders (requireAuth). These types are the
// shared Order shape used by the customer order pages AND the admin order
// detail page (/admin/orders/:id returns the same full Order) — the admin
// LIST endpoint returns a slimmer projection, which stays in lib/api/admin.ts.

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["RAZORPAY", "COD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Mirrors kaicho-be's SHIPMENT_STATUSES. Subordinate to `status` above — it
// adds courier-level detail (Packed / In transit / Failed delivery have no
// order-status equivalent); the backend keeps `status` in sync as this moves.
export const SHIPMENT_STATUSES = [
  "ORDER_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "FAILED_DELIVERY",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  ORDER_CONFIRMED: "Order confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED_DELIVERY: "Failed delivery",
};

// The ordered happy-path steps the customer timeline renders. The two
// exception states are handled with a callout, not a step.
export const SHIPMENT_TIMELINE_STEPS: readonly ShipmentStatus[] = [
  "ORDER_CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export interface OrderShipmentHistoryEntry {
  status: ShipmentStatus;
  at: string;
  note?: string;
}

export interface OrderShipment {
  carrier: string;
  trackingNumber: string;
  shipmentId: string | null;
  status: ShipmentStatus;
  shippedAt: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  trackingUrl: string | null;
  history: OrderShipmentHistoryEntry[];
}

export type ShipmentTimelineState = "pending" | "in_progress" | "delivered" | "exception";

/** Where a shipment sits on the visual timeline. `stepIndex` is the index into
 *  SHIPMENT_TIMELINE_STEPS of the furthest-reached step (−1 if none); for the
 *  two exception states it's the last on-path step recorded in history. */
export function shipmentProgress(shipment: Pick<OrderShipment, "status" | "history">): {
  stepIndex: number;
  state: ShipmentTimelineState;
} {
  const onPathIndex = (s: ShipmentStatus) => SHIPMENT_TIMELINE_STEPS.indexOf(s);

  if (shipment.status === "CANCELLED" || shipment.status === "FAILED_DELIVERY") {
    const lastOnPath = [...shipment.history]
      .reverse()
      .map((h) => onPathIndex(h.status))
      .find((i) => i >= 0);
    return { stepIndex: lastOnPath ?? -1, state: "exception" };
  }

  const stepIndex = onPathIndex(shipment.status);
  if (stepIndex === SHIPMENT_TIMELINE_STEPS.length - 1) return { stepIndex, state: "delivered" };
  return { stepIndex, state: stepIndex >= 0 ? "in_progress" : "pending" };
}

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  /** Snapshot of the product's primary image at order time — null if it had none. */
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  mrp: number;
  discount: number;
  discountPercentage: number;
  lineTotal: number;
}

export interface OrderPricing {
  subtotal: number;
  shippingFee: number;
  taxTotal: number;
  grandTotal: number;
}

export interface OrderAddress {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderStatusHistoryEntry {
  status: string;
  at: string;
  note?: string;
}

export interface Order {
  // The backend's DTO field is `orderId`, not `id` — matches the rest of the
  // codebase's convention of naming a document's own id `<entity>Id` (see
  // product.service.ts's `productId`), reserving bare `id` for nested/joined
  // entities (e.g. this order's `customer.userId` on the admin detail type).
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  pricing: OrderPricing;
  shippingAddress: OrderAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  statusHistory: OrderStatusHistoryEntry[];
  /** Courier / tracking record — null until an admin creates a shipment. */
  shipment: OrderShipment | null;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListParams {
  page?: number;
  pageSize?: number;
}

export interface OrderListResult {
  items: Order[];
  page: number;
  pageSize: number;
  total: number;
}

/** Statuses a customer is allowed to cancel from — mirrors the backend's
 *  transition table. UI-only: the backend re-checks and is the authority. */
export const CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PROCESSING",
];

export function isCancellable(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Payment pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

export function fetchOrders({ page = 1, pageSize = 10 }: OrderListParams = {}): Promise<OrderListResult> {
  return apiFetch<OrderListResult>(`/orders?page=${page}&pageSize=${pageSize}`, { method: "GET" });
}

// order.controller.ts wraps single-order responses as {order}, matching the
// rest of the codebase's product/brand/checkout controllers — unwrap that
// one level here so every caller above this file just deals in `Order`.
export async function fetchOrder(orderNumber: string): Promise<Order> {
  const { order } = await apiFetch<{ order: Order }>(`/orders/${encodeURIComponent(orderNumber)}`, {
    method: "GET",
  });
  return order;
}

export async function cancelOrder(orderNumber: string, reason?: string): Promise<Order> {
  const { order } = await apiFetch<{ order: Order }>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return order;
}
