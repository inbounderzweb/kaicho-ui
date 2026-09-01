"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Breadcrumbs from "../ui/Breadcrumbs";
import Button from "../ui/Button";
import AddressLines from "../address/AddressLines";
import CancelOrderDialog from "./CancelOrderDialog";
import { OrderStatusBadge, PaymentStatusBadge, ShipmentStatusBadge } from "./OrderStatusBadge";
import ShipmentTimeline from "./ShipmentTimeline";
import { useOrder } from "@/lib/hooks/useOrder";
import { useCancelOrder } from "@/lib/hooks/useCancelOrder";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { resolveMediaUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import {
  isCancellable,
  ORDER_STATUS_LABELS,
  SHIPMENT_STATUS_LABELS,
  type OrderStatus,
  type ShipmentStatus,
} from "@/lib/api/order";
import { IconPackage, IconTruck } from "../ui/icons";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** statusHistory entries carry a raw status string from the backend; fall
 *  back to the raw value if it's ever one this build doesn't know about. */
function labelForStatus(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export default function OrderDetailClient({ orderNumber }: { orderNumber: string }) {
  const { isAuthorized, authState, refetch: refetchUser } = useRequireAuth();
  const { data: order, isLoading, isError, error, refetch } = useOrder(isAuthorized ? orderNumber : "");
  const cancelMutation = useCancelOrder();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "My Account", href: "/profile" },
    { label: `Order ${orderNumber}`, href: `/orders/${orderNumber}` },
  ];

  if (authState === "error") {
    return (
      <section className="mx-auto flex max-w-[1280px] flex-col items-center justify-center gap-3 px-5 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-ink">Couldn&apos;t load your account.</p>
        <button
          type="button"
          onClick={() => refetchUser()}
          className="mt-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!isAuthorized || isLoading) {
    return (
      <section className="mx-auto flex max-w-[1280px] items-center justify-center px-5 py-24 sm:px-6 lg:px-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
      </section>
    );
  }

  if (isError || !order) {
    const status = error instanceof ApiError ? error.status : 0;
    const notFound = status === 404 || status === 403;
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Breadcrumbs items={breadcrumbs} className="mb-4" />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <IconPackage className="h-10 w-10 text-ink-faint" />
          <p className="mt-4 text-base font-semibold text-ink">
            {notFound ? "We couldn't find that order" : "Couldn't load this order"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {notFound
              ? "It may have been removed, or it belongs to a different account."
              : "This looks like a connection problem. Try again in a moment."}
          </p>
          {notFound ? (
            <Button href="/profile" className="mt-6">
              View my orders
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-6 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Try again
            </button>
          )}
        </div>
      </section>
    );
  }

  const canCancel = isCancellable(order.status);
  const shipment = order.shipment;

  // Detailed log below the visual timeline: prefer the shipment's own history
  // (finer-grained — Packed / In transit have no order-status equivalent),
  // falling back to the order status history when there's no shipment yet.
  const detailLog =
    shipment && shipment.history.length > 0
      ? shipment.history.map((entry) => ({
          label: SHIPMENT_STATUS_LABELS[entry.status as ShipmentStatus] ?? entry.status,
          at: entry.at,
          note: entry.note,
        }))
      : order.statusHistory.map((entry) => ({
          label: labelForStatus(entry.status),
          at: entry.at,
          note: entry.note,
        }));

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={breadcrumbs} className="mb-4" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {order.status === "PENDING_PAYMENT" && (
        <p className="mt-4 rounded-xl bg-gold/10 p-4 text-sm font-semibold text-gold">
          We haven&apos;t received your payment yet. Unpaid orders are cancelled automatically after a
          short while and the items released back into stock.
        </p>
      )}

      {order.status === "CANCELLED" && order.cancelReason && (
        <p className="mt-4 rounded-xl bg-sale/10 p-4 text-sm text-sale">
          <span className="font-semibold">Cancellation reason:</span> {order.cancelReason}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink">
              {order.items.length} {order.items.length === 1 ? "item" : "items"}
            </h2>
            <ul className="mt-4 divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.productId} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                    {item.imageUrl ? (
                      <Image
                        src={resolveMediaUrl(item.imageUrl)}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-ink-faint">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-ink">{item.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">SKU {item.sku}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Qty {item.quantity} × Rs. {item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm font-bold text-ink">
                    Rs. {item.lineTotal.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Delivery progress / status timeline */}
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink">
              {shipment ? "Delivery progress" : "Order timeline"}
            </h2>

            {shipment && (
              <div className="mt-5">
                <ShipmentTimeline shipment={shipment} />
              </div>
            )}

            {detailLog.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No updates yet.</p>
            ) : (
              <ol className={shipment ? "mt-6 space-y-0 border-t border-border pt-5" : "mt-4 space-y-0"}>
                {detailLog.map((entry, i) => {
                  const isLatest = i === detailLog.length - 1;
                  return (
                    <li key={`${entry.label}-${entry.at}-${i}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            isLatest ? "bg-brand" : "bg-border"
                          }`}
                        />
                        {!isLatest && <span className="w-px flex-1 bg-border" />}
                      </div>
                      <div className={isLatest ? "pb-0" : "pb-5"}>
                        <p className="text-sm font-semibold text-ink">{entry.label}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(entry.at)}</p>
                        {entry.note && <p className="mt-1 text-sm text-ink-muted">{entry.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-6 lg:col-span-1">
          {/* Totals */}
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink">Payment</h2>
            <div className="mt-4 space-y-2.5 border-b border-border pb-4 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">Rs. {order.pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Shipping</span>
                <span className={`font-semibold ${order.pricing.shippingFee === 0 ? "text-brand" : "text-ink"}`}>
                  {order.pricing.shippingFee === 0 ? "Free" : `Rs. ${order.pricing.shippingFee.toFixed(2)}`}
                </span>
              </div>
              {order.pricing.taxTotal > 0 && (
                <div className="flex justify-between text-ink-muted">
                  <span>Tax</span>
                  <span className="font-semibold text-ink">Rs. {order.pricing.taxTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-base font-bold text-ink">Total</span>
              <span className="text-xl font-extrabold text-brand">
                Rs. {order.pricing.grandTotal.toFixed(2)}
              </span>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online (Razorpay)"}
            </p>
          </section>

          {/* Shipment tracking */}
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink">Shipment tracking</h2>
            {shipment ? (
              <>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Delivery partner</dt>
                    <dd className="text-right font-semibold text-ink">{shipment.carrier}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Tracking / AWB</dt>
                    <dd className="break-all text-right font-semibold text-ink">
                      {shipment.trackingNumber}
                    </dd>
                  </div>
                  {shipment.estimatedDeliveryAt && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Expected delivery</dt>
                      <dd className="text-right font-semibold text-ink">
                        {formatDate(shipment.estimatedDeliveryAt)}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-ink-muted">Status</dt>
                    <dd>
                      <ShipmentStatusBadge status={shipment.status} />
                    </dd>
                  </div>
                </dl>
                {shipment.trackingUrl ? (
                  <a
                    href={shipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                  >
                    <IconTruck className="h-4 w-4" />
                    Track shipment
                  </a>
                ) : (
                  <p className="mt-4 text-xs text-ink-muted">
                    A live tracking link will appear here once the courier shares it.
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                Tracking details will appear here once your order ships.
              </p>
            )}
          </section>

          {/* Shipping address */}
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-ink">Shipping to</h2>
            {order.shippingAddress.label && (
              <p className="mt-2 text-sm font-bold text-ink">{order.shippingAddress.label}</p>
            )}
            <AddressLines address={order.shippingAddress} className="mt-1" />
          </section>

          {canCancel && (
            <button
              type="button"
              onClick={() => {
                setCancelError(null);
                setCancelOpen(true);
              }}
              className="w-full rounded-full border border-sale/30 px-5 py-2.5 text-sm font-semibold text-sale transition-colors hover:bg-sale/10"
            >
              Cancel order
            </button>
          )}

          <Link
            href="/profile"
            className="block text-center text-xs font-semibold text-ink-muted transition-colors hover:text-brand"
          >
            Back to my orders
          </Link>
        </div>
      </div>

      <CancelOrderDialog
        open={cancelOpen}
        orderNumber={order.orderNumber}
        isCancelling={cancelMutation.isPending}
        errorMessage={cancelError}
        onConfirm={(reason) => {
          setCancelError(null);
          cancelMutation.mutate(
            { orderNumber: order.orderNumber, reason },
            {
              onSuccess: () => setCancelOpen(false),
              onError: (err) =>
                setCancelError(
                  err instanceof ApiError ? err.message : "Couldn't cancel this order. Please try again."
                ),
            }
          );
        }}
        onCancel={() => {
          setCancelOpen(false);
          setCancelError(null);
        }}
      />
    </section>
  );
}
