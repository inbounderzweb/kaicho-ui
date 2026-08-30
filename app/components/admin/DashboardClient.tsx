"use client";

import Link from "next/link";
import { useAdminDashboard } from "@/lib/hooks/admin/useAdminDashboard";
import StatCard from "./StatCard";
import TrendChart from "./TrendChart";
import { OrderStatusBadge } from "./OrderStatusBadge";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function DashboardClient() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold sm:text-2xl">Dashboard</h1>
        <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
          Overview of the last 14 days. Sample data — not yet wired to real orders.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue (14d)" value={currency.format(data.stats.totalRevenue)} />
        <StatCard label="Orders (14d)" value={data.stats.totalOrders.toLocaleString("en-IN")} />
        <StatCard label="Total Users" value={data.stats.totalUsers.toLocaleString("en-IN")} />
        <StatCard label="Products" value={data.stats.totalProducts.toString()} />
      </div>

      <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <h2 className="text-sm font-semibold">Revenue trend</h2>
        <div className="mt-4">
          <TrendChart data={data.trend} />
        </div>
      </div>

      <div className="rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary">
            View all
          </Link>
        </div>
        <div className="mt-4 divide-y divide-admin-border dark:divide-admin-border-dark">
          {data.recentOrders.map((order) => (
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
      </div>
    </div>
  );
}
