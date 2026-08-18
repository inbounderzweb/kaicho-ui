"use client";

import { useMemo, useState } from "react";
import ProductArt from "../sections/ProductArt";
import { IconTruck } from "../ui/icons";
import { ORDERS, type Order, type OrderStatus } from "./profile-data";

const TABS = [
  { id: "current", label: "Current" },
  { id: "unpaid", label: "Unpaid" },
  { id: "all", label: "All orders" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  "On the way": "text-terracotta",
  Delivered: "text-brand",
  Cancelled: "text-sale",
  Processing: "text-gold",
};

function filterOrders(tab: TabId): Order[] {
  if (tab === "unpaid") return ORDERS.filter((order) => !order.paid);
  if (tab === "current") {
    return ORDERS.filter(
      (order) => order.status === "On the way" || order.status === "Processing"
    );
  }
  return ORDERS;
}

export default function OrdersSection() {
  const [tab, setTab] = useState<TabId>("current");
  const orders = useMemo(() => filterOrders(tab), [tab]);

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
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <IconTruck className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-3 text-sm font-semibold text-ink">No orders here</p>
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-5">
        <div>
          <h3 className="font-display text-base font-bold text-ink sm:text-lg">
            Order #{order.id}
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
            {order.items.length} {order.items.length === 1 ? "Product" : "Products"} ·{" "}
            {order.placedOn}
          </p>
        </div>
        <span className={`text-sm font-bold ${STATUS_STYLES[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div className="space-y-2 border-b border-border p-5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-ink-muted">Date of delivery</span>
          <span className="font-semibold text-ink">{order.deliveryDate}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="shrink-0 text-ink-muted">Delivered to</span>
          <span className="text-right font-semibold text-ink">{order.deliveredTo}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1">
          <span className="font-bold text-ink">Total</span>
          <span className="font-bold text-ink">Rs. {order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        {order.items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream">
              <ProductArt accent={item.accent} count={item.artCount} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Qty: {item.quantity}x = Rs. {(item.price * item.quantity).toFixed(2)}
              </p>
              {item.variant && <p className="text-xs text-ink-muted">{item.variant}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
