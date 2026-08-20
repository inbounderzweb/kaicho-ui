"use client";

import { useState } from "react";
import { useAdminOrders } from "@/lib/hooks/admin/useAdminOrders";
import StatusBadge from "./StatusBadge";
import AdminPagination from "./AdminPagination";

const PAGE_SIZE = 8;

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function OrdersClient() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useAdminOrders({
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Orders</h1>
        <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
          Sample data — not yet wired to a real order-management system.
        </p>
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
                    <th className="px-5 py-3 font-semibold">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                  {data.items.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-semibold">{o.id}</td>
                      <td className="px-5 py-3 text-black/70 dark:text-white/70">{o.customer}</td>
                      <td className="px-5 py-3 tabular-nums text-black/70 dark:text-white/70">{o.items}</td>
                      <td className="px-5 py-3 tabular-nums font-semibold">{currency.format(o.total)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={o.status} />
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
                <div key={o.id} className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{o.id}</p>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-xs text-black/60 dark:text-white/60">{o.customer}</p>
                  <p className="text-xs tabular-nums text-black/60 dark:text-white/60">
                    {o.items} item{o.items > 1 ? "s" : ""} · {currency.format(o.total)}
                  </p>
                </div>
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
