import type { OrderStatus, ShipmentStatus } from "./order";

/**
 * UI-only mirror of the backend's customer-email rules (orderStatusNotification.ts
 * and shipment.service.ts), used to decide whether the "email the client?" prompt
 * is worth showing. The server is the only enforcement: it emails solely when the
 * request says `sendEmail: true`, and only for these milestones.
 */
export const EMAIL_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
]);

const FULFILMENT_SEQUENCE: readonly OrderStatus[] = ["CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const SHIPMENT_TO_ORDER_STATUS: Partial<Record<ShipmentStatus, OrderStatus>> = {
  ORDER_CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  PACKED: "PROCESSING",
  SHIPPED: "SHIPPED",
  IN_TRANSIT: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
};

/** The order status a shipment update leaves the order in (it only ever moves forward). */
export function orderStatusAfterShipment(current: OrderStatus, shipmentStatus: ShipmentStatus): OrderStatus {
  const target = SHIPMENT_TO_ORDER_STATUS[shipmentStatus];
  const from = FULFILMENT_SEQUENCE.indexOf(current);
  const to = target ? FULFILMENT_SEQUENCE.indexOf(target) : -1;
  return from === -1 || to === -1 || to <= from ? current : (target as OrderStatus);
}

/** Would moving the order to `next` produce a customer email? */
export function statusChangeEmails(current: OrderStatus, next: OrderStatus): boolean {
  return next !== current && EMAIL_STATUSES.has(next);
}

/** Would this shipment update move the order to a status that emails the customer? */
export function shipmentChangeEmails(current: OrderStatus, shipmentStatus: ShipmentStatus): boolean {
  return statusChangeEmails(current, orderStatusAfterShipment(current, shipmentStatus));
}

/** Only a verified address is ever emailed. */
export function canEmailCustomer(customer?: { email?: string | null; emailVerified?: boolean } | null): customer is { email: string; emailVerified: true } {
  return Boolean(customer?.email) && customer?.emailVerified === true;
}
