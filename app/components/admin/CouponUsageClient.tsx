"use client";

import { useState } from "react";
import { useCouponUsages } from "@/lib/hooks/admin/useCoupons";
import AdminPagination from "./AdminPagination";

function fmtDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CouponUsageClient({ couponId }: { couponId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useCouponUsages(
    couponId,
    page,
    pageSize
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark">
      <div className="flex items-center justify-between border-b border-admin-border px-5 py-3 dark:border-admin-border-dark">
        <h2 className="text-sm font-bold">Usage history</h2>
        {data && (
          <span className="text-xs font-semibold text-black/55 dark:text-white/55">
            {data.totalUsage.toLocaleString("en-IN")} total redemption{data.totalUsage === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="flex flex-col items-start gap-3 p-6">
          <p className="text-sm font-semibold">Couldn&apos;t load usage history.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
          >
            Retry
          </button>
        </div>
      ) : data.items.length === 0 ? (
        <p className="p-8 text-center text-sm text-black/55 dark:text-white/55">
          This coupon hasn&apos;t been redeemed yet.
        </p>
      ) : (
        <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Discount</th>
                  <th className="px-5 py-3 font-semibold">Used at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border dark:divide-admin-border-dark">
                {data.items.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-3">{row.customer}</td>
                    <td className="px-5 py-3 font-mono text-black/70 dark:text-white/70">{row.orderNumber}</td>
                    <td className="px-5 py-3 tabular-nums text-black/70 dark:text-white/70">
                      {row.freeDelivery ? "Free delivery" : `₹${row.discountAmount}`}
                    </td>
                    <td className="px-5 py-3 text-black/55 dark:text-white/55">{fmtDateTime(row.usedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={page}
            pageSize={pageSize}
            total={data.total}
            itemLabel="redemptions"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
