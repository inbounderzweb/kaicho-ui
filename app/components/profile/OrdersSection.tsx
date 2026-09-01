"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { OrderStatusBadge, PaymentStatusBadge, ShipmentStatusBadge } from "../orders/OrderStatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { resolveMediaUrl } from "@/lib/api/client";
import type { Order } from "@/lib/api/order";
import { IconArrowRight, IconTruck } from "../ui/icons";
import Button from "../ui/Button";

const PAGE_SIZE = 10;

const TABS = [
  { id: "current", label: "Current" },
  { id: "unpaid", label: "Unpaid" },
  { id: "all", label: "All orders" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// "Current" = still in flight (anything before it's delivered, cancelled,
// returned or refunded). "Unpaid" is derived from the real paymentStatus
// rather than the old mock's boolean `paid` flag.
const SETTLED_STATUSES = new Set(["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"]);

function matchesTab(order: Order, tab: TabId): boolean {
  if (tab === "all") return true;
  if (tab === "unpaid") return order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED";
  return !SETTLED_STATUSES.has(order.status);
}

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

export default function OrdersSection() {
  const [tab, setTab] = useState<TabId>("current");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useOrders({
    page,
    pageSize: PAGE_SIZE,
  });

  // Filtering is client-side over the current page: the tabs are a view of
  // what's already loaded, not a server query (the /orders endpoint takes
  // no status filter). Pagination stays server-side.
  const orders = useMemo(
    () => (data?.items ?? []).filter((order) => matchesTab(order, tab)),
    [data, tab]
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <div className="flex gap-1 rounded-full bg-cream p-1 text-sm font-semibold">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full px-4 py-2.5 transition-colors ${
              tab === id ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="space-y-3 p-5">
                <div className="h-5 w-40 animate-pulse rounded bg-cream" />
                <div className="h-4 w-56 animate-pulse rounded bg-cream" />
                <div className="h-16 w-full animate-pulse rounded-xl bg-cream" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-base font-semibold text-ink">Couldn&apos;t load your orders</p>
            <p className="mt-1 text-sm text-ink-muted">
              This looks like a connection problem. Try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Try again
            </button>
          </div>
        ) : (data?.total ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <IconTruck className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-3 text-base font-semibold text-ink">No orders yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              When you place an order, it&apos;ll show up here.
            </p>
            <Button href="/products" className="mt-6">
              Start shopping
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <IconTruck className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-3 text-sm font-semibold text-ink">No orders here</p>
            <p className="mt-1 text-sm text-ink-muted">Nothing on this page matches this filter.</p>
          </div>
        ) : (
          <div className={isPlaceholderData ? "space-y-6 opacity-60 transition-opacity" : "space-y-6"}>
            {orders.map((order) => (
              <OrderCard key={order.orderNumber} order={order} />
            ))}
          </div>
        )}
      </div>

      {data && totalPages > 1 && !isLoading && !isError && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-ink-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const href = `/orders/${encodeURIComponent(order.orderNumber)}`;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-5">
        <div className="min-w-0">
          <Link href={href}>
            <h3 className="font-display text-base font-bold text-ink hover:text-brand sm:text-lg">
              Order {order.orderNumber}
            </h3>
          </Link>
          <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
            {itemCount} {itemCount === 1 ? "item" : "items"} · {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="space-y-2 border-b border-border p-5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="shrink-0 text-ink-muted">Delivering to</span>
          <span className="text-right font-semibold text-ink">
            {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.pincode}
          </span>
        </div>
        {order.shipment && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <IconTruck className="h-4 w-4 shrink-0" />
              {order.shipment.carrier} · AWB {order.shipment.trackingNumber}
            </span>
            <span className="flex items-center gap-2">
              {order.shipment.estimatedDeliveryAt && (
                <span className="text-ink-muted">
                  Arriving{" "}
                  {new Date(order.shipment.estimatedDeliveryAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
              <ShipmentStatusBadge status={order.shipment.status} />
            </span>
          </div>
        )}
        <div className="flex justify-between gap-4 pt-1">
          <span className="font-bold text-ink">Total</span>
          <span className="font-bold text-ink">Rs. {order.pricing.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        {order.items.map((item) => (
          <div key={item.productId} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream">
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
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Qty: {item.quantity} × Rs. {item.unitPrice.toFixed(2)} = Rs. {item.lineTotal.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border px-5 py-4">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
        >
          View order details
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
