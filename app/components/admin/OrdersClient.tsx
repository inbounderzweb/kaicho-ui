"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminOrders } from "@/lib/hooks/admin/useAdminOrders";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from "@/lib/api/order";
import type { OrderStatus, PaymentStatus } from "@/lib/api/order";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";
import AdminPagination from "./AdminPagination";

const PAGE_SIZE = 10;

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const selectClass =
  "rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm dark:border-admin-border-dark dark:bg-admin-surface-dark";

export default function OrdersClient() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "all">("all");

  const { data, isLoading, isError, refetch, isPlaceholderData } = useAdminOrders({
    page,
    pageSize: PAGE_SIZE,
    status,
    paymentStatus,
  });

  // Filters are server-side, so a change has to reset back to page 1 —
  // otherwise a narrow filter can land the customer on an empty page 4.
  const changeStatus = (next: OrderStatus | "all") => {
    setStatus(next);
    setPage(1);
  };
  const changePaymentStatus = (next: PaymentStatus | "all") => {
    setPaymentStatus(next);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Orders</h1>
        <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
          Manage customer orders, statuses and refunds.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark sm:flex-row sm:flex-wrap sm:items-center">
        <select value={status} onChange={(e) => changeStatus(e.target.value as OrderStatus | "all")} className={selectClass}>
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={paymentStatus}
          onChange={(e) => changePaymentStatus(e.target.value as PaymentStatus | "all")}
          className={selectClass}
        >
          <option value="all">All payment states</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {(status !== "all" || paymentStatus !== "all") && (
          <button
            type="button"
            onClick={() => {
              setStatus("all");
              setPaymentStatus("all");
              setPage(1);
            }}
            className="text-sm font-semibold text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm font-semibold">Couldn&apos;t load orders.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : data.items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold">No orders match these filters.</p>
          </div>
        ) : (
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-5 py-3 font-semibold">Items</th>
                    <th className="px-5 py-3 font-semibold">Total</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Payment</th>
                    <th className="px-5 py-3 font-semibold">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {data.items.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-semibold">
                        <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                          {o.id}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-black/70 dark:text-white/70">{o.customer}</td>
                      <td className="px-5 py-3 tabular-nums text-black/70 dark:text-white/70">{o.items}</td>
                      <td className="px-5 py-3 tabular-nums font-semibold">{currency.format(o.total)}</td>
                      <td className="px-5 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-3">
                        {o.paymentStatus ? <PaymentStatusBadge status={o.paymentStatus} /> : "—"}
                      </td>
                      <td className="px-5 py-3 text-black/55 dark:text-white/55">
                        {new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-admin-border sm:hidden dark:divide-admin-border-dark">
              {data.items.map((o) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="block space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{o.id}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="text-xs text-black/60 dark:text-white/60">{o.customer}</p>
                  <p className="text-xs tabular-nums text-black/60 dark:text-white/60">
                    {o.items} item{o.items > 1 ? "s" : ""} · {currency.format(o.total)}
                  </p>
                  {o.paymentStatus && <PaymentStatusBadge status={o.paymentStatus} />}
                </Link>
              ))}
            </div>
          </div>
        )}
        {data && !isLoading && !isError && (
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
