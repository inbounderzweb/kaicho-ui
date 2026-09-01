"use client";

import Link from "next/link";
import { useAdminDashboard } from "@/lib/hooks/admin/useAdminDashboard";
import { ORDER_STATUS_LABELS } from "@/lib/api/order";
import StatCard from "./StatCard";
import TrendChart from "./TrendChart";
import { OrderStatusBadge } from "./OrderStatusBadge";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const currency2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
const number = new Intl.NumberFormat("en-IN");

export default function DashboardClient() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark"
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-admin-border bg-admin-card p-6 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <p className="text-sm font-semibold">Couldn&apos;t load dashboard data.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, trend, recentOrders, ordersByStatus, topProducts } = data;
  const maxStatusCount = Math.max(1, ...ordersByStatus.map((s) => s.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Dashboard</h1>
        <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
          Live store overview. Revenue and order totals are all-time (cancelled orders excluded); the trend
          chart covers the last 14 days.
        </p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={currency.format(stats.totalRevenue)}
          hint={`${currency.format(stats.revenue30d)} in the last 30 days`}
        />
        <StatCard
          label="Orders"
          value={number.format(stats.totalOrders)}
          hint={`${number.format(stats.orders30d)} in the last 30 days`}
        />
        <StatCard
          label="Total Users"
          value={number.format(stats.totalUsers)}
          hint={`+${number.format(stats.newUsers30d)} in the last 30 days`}
        />
        <StatCard
          label="Products"
          value={number.format(stats.totalProducts)}
          hint={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low on stock` : "Stock levels healthy"}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Avg. order value" value={currency2.format(stats.averageOrderValue)} />
        <StatCard
          label="Pending fulfilment"
          value={number.format(stats.pendingOrders)}
          hint="Paid, not yet shipped"
        />
        <StatCard label="Low-stock products" value={number.format(stats.lowStockProducts)} />
        <StatCard label="Published blogs" value={number.format(stats.publishedBlogs)} />
      </div>

      {/* Trend */}
      <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <h2 className="text-sm font-semibold">Revenue trend · last 14 days</h2>
        <div className="mt-4">
          <TrendChart data={trend} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary"
            >
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-black/45 dark:text-white/45">No orders yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-admin-border dark:divide-admin-border-dark">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{order.id}</p>
                    <p className="truncate text-black/55 dark:text-white/55">{order.customer}</p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">{currency.format(order.total)}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
          <h2 className="text-sm font-semibold">Orders by status</h2>
          {ordersByStatus.length === 0 ? (
            <p className="mt-4 text-sm text-black/45 dark:text-white/45">No orders yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {ordersByStatus.map((row) => (
                <li key={row.status} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-black/70 dark:text-white/70">
                      {ORDER_STATUS_LABELS[row.status] ?? row.status}
                    </span>
                    <span className="font-semibold tabular-nums">{number.format(row.count)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-admin-primary-dark dark:bg-admin-primary"
                      style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <h2 className="text-sm font-semibold">Top products · last 30 days</h2>
        {topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-black/45 dark:text-white/45">No sales in the last 30 days.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-black/45 dark:text-white/45">
                  <th className="pb-2 font-semibold">Product</th>
                  <th className="pb-2 text-right font-semibold">Units</th>
                  <th className="pb-2 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                {topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td className="py-2.5 pr-3 font-medium">{p.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{number.format(p.unitsSold)}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{currency.format(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
