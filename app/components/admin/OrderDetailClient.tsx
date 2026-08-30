"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAdminOrderDetail } from "@/lib/hooks/admin/useAdminOrderDetail";
import { useUpdateOrderStatus } from "@/lib/hooks/admin/useUpdateOrderStatus";
import { useRefundOrder } from "@/lib/hooks/admin/useRefundOrder";
import { resolveMediaUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/api/order";
import { nextStatuses } from "@/lib/api/orderTransitions";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";
import ConfirmDialog from "./ConfirmDialog";
import { IconChevronLeft } from "../ui/icons";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const cardClass =
  "rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark";
const sectionTitleClass =
  "font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70";
const inputClass =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";

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

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function OrderDetailClient({ id }: { id: string }) {
  const { data: order, isLoading, isError, error, refetch } = useAdminOrderDetail(id);
  const statusMutation = useUpdateOrderStatus(id);
  const refundMutation = useRefundOrder(id);

  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="h-96 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  if (isError || !order) {
    const status = error instanceof ApiError ? error.status : 0;
    const message =
      status === 404
        ? "This order doesn't exist, or isn't reachable from here."
        : status === 403
          ? "You don't have permission to view this order."
          : "Couldn't load this order.";
    return (
      <div className={`flex flex-col items-start gap-3 ${cardClass}`}>
        <p className="text-sm font-semibold">{message}</p>
        <div className="flex gap-2">
          {status !== 404 && status !== 403 && (
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
            >
              Retry
            </button>
          )}
          <Link
            href="/admin/orders"
            className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const allowedNext = nextStatuses(order.status);
  const customerName = order.customer?.name || order.customer?.phone || order.customer?.userId || "—";
  // Only a captured online payment can be refunded through Razorpay; COD
  // and unpaid orders have nothing to send back.
  const canRefund =
    order.paymentMethod === "RAZORPAY" &&
    (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED");

  const parsedRefund = refundAmount.trim() === "" ? undefined : Number(refundAmount);
  const refundAmountInvalid =
    parsedRefund !== undefined &&
    (Number.isNaN(parsedRefund) || parsedRefund <= 0 || parsedRefund > order.pricing.grandTotal);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Orders
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">{order.orderNumber}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Order {order.orderNumber}</h1>
          <p className="mt-0.5 text-sm text-black/55 dark:text-white/55">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Line items */}
          <section className={`space-y-4 ${cardClass}`}>
            <h2 className={sectionTitleClass}>Items</h2>
            <ul className="divide-y divide-admin-border dark:divide-admin-border-dark">
              {order.items.map((item) => (
                <li key={item.productId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
                    {item.imageUrl ? (
                      <Image
                        src={resolveMediaUrl(item.imageUrl)}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="mt-0.5 text-xs text-black/55 dark:text-white/55">SKU {item.sku}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-black/55 dark:text-white/55">
                      {item.quantity} × {currency.format(item.unitPrice)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                    {currency.format(item.lineTotal)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-1.5 border-t border-admin-border pt-4 text-sm dark:border-admin-border-dark">
              <div className="flex justify-between text-black/60 dark:text-white/60">
                <span>Subtotal</span>
                <span className="tabular-nums">{currency.format(order.pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-black/60 dark:text-white/60">
                <span>Shipping</span>
                <span className="tabular-nums">{currency.format(order.pricing.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-black/60 dark:text-white/60">
                <span>Tax</span>
                <span className="tabular-nums">{currency.format(order.pricing.taxTotal)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">{currency.format(order.pricing.grandTotal)}</span>
              </div>
            </div>
          </section>

          {/* Status history */}
          <section className={`space-y-4 ${cardClass}`}>
            <h2 className={sectionTitleClass}>Status history</h2>
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-black/55 dark:text-white/55">No status changes recorded yet.</p>
            ) : (
              <ol className="space-y-3">
                {order.statusHistory.map((entry, i) => (
                  <li key={`${entry.status}-${entry.at}-${i}`} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-admin-primary-dark" />
                    <div>
                      <p className="font-semibold">
                        {ORDER_STATUS_LABELS[entry.status as OrderStatus] ?? entry.status}
                      </p>
                      <p className="text-xs text-black/55 dark:text-white/55">{formatDateTime(entry.at)}</p>
                      {entry.note && (
                        <p className="mt-0.5 text-xs text-black/70 dark:text-white/70">{entry.note}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Customer */}
          <section className={`space-y-2 ${cardClass}`}>
            <h2 className={sectionTitleClass}>Customer</h2>
            <p className="text-sm font-semibold">{customerName}</p>
            {order.customer?.phone && (
              <p className="text-sm text-black/60 dark:text-white/60">{order.customer.phone}</p>
            )}
            {order.customer?.email && (
              <p className="text-sm text-black/60 dark:text-white/60">{order.customer.email}</p>
            )}
            {order.customer?.userId && (
              <Link
                href={`/admin/users/${order.customer.userId}`}
                className="inline-block text-xs font-semibold text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                View customer →
              </Link>
            )}
          </section>

          {/* Shipping address */}
          <section className={`space-y-2 ${cardClass}`}>
            <h2 className={sectionTitleClass}>Shipping address</h2>
            {order.shippingAddress.label && (
              <p className="text-sm font-semibold">{order.shippingAddress.label}</p>
            )}
            <div className="text-sm text-black/60 dark:text-white/60">
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </p>
            </div>
          </section>

          {/* Status update */}
          <section className={`space-y-3 ${cardClass}`}>
            <h2 className={sectionTitleClass}>Update status</h2>
            {allowedNext.length === 0 ? (
              <p className="text-sm text-black/55 dark:text-white/55">
                {ORDER_STATUS_LABELS[order.status]} is a final state — no further transitions.
              </p>
            ) : (
              <>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as OrderStatus | "")}
                  className={inputClass}
                >
                  <option value="">Select new status…</option>
                  {allowedNext.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <input
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  maxLength={300}
                  placeholder="Note (optional)"
                  className={inputClass}
                />
                {statusMutation.isError && (
                  <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                    {messageOf(statusMutation.error, "Couldn't update the status. Please try again.")}
                  </p>
                )}
                <button
                  type="button"
                  disabled={!nextStatus || statusMutation.isPending}
                  onClick={() => {
                    if (!nextStatus) return;
                    statusMutation.mutate(
                      { status: nextStatus, note: statusNote.trim() || undefined },
                      {
                        onSuccess: () => {
                          setNextStatus("");
                          setStatusNote("");
                        },
                      }
                    );
                  }}
                  className="w-full rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {statusMutation.isPending ? "Updating…" : "Update status"}
                </button>
                <p className="text-[11px] text-black/45 dark:text-white/45">
                  Only transitions the backend accepts from{" "}
                  {ORDER_STATUS_LABELS[order.status]} are listed. The server re-validates every change.
                </p>
              </>
            )}
          </section>

          {/* Refund */}
          <section className={`space-y-3 ${cardClass}`}>
            <h2 className={sectionTitleClass}>Refund</h2>
            {!canRefund ? (
              <p className="text-sm text-black/55 dark:text-white/55">
                {order.paymentMethod === "COD"
                  ? "Cash-on-delivery orders aren't refundable through the payment gateway."
                  : "Only a captured online payment can be refunded."}
              </p>
            ) : (
              <>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
                  Amount
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`Full refund (${currency.format(order.pricing.grandTotal)})`}
                  className={inputClass}
                />
                <p className="text-[11px] text-black/45 dark:text-white/45">
                  Leave blank for a full refund — the refundable amount is computed server-side.
                </p>
                {refundAmountInvalid && (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                    Enter an amount between 0 and {currency.format(order.pricing.grandTotal)}.
                  </p>
                )}
                <button
                  type="button"
                  disabled={refundMutation.isPending || refundAmountInvalid}
                  onClick={() => {
                    setRefundError(null);
                    setRefundOpen(true);
                  }}
                  className="w-full rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                >
                  {parsedRefund === undefined ? "Refund in full" : `Refund ${currency.format(parsedRefund)}`}
                </button>
              </>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={refundOpen}
        title="Issue refund?"
        description={
          refundError ??
          `${
            parsedRefund === undefined
              ? `A full refund of ${currency.format(order.pricing.grandTotal)}`
              : `A refund of ${currency.format(parsedRefund)}`
          } will be sent back through Razorpay for order ${order.orderNumber}. This can't be undone.`
        }
        confirmLabel="Refund"
        destructive
        isConfirming={refundMutation.isPending}
        onConfirm={() => {
          setRefundError(null);
          refundMutation.mutate(parsedRefund, {
            onSuccess: () => {
              setRefundOpen(false);
              setRefundAmount("");
            },
            onError: (err) => setRefundError(messageOf(err, "Couldn't issue the refund. Please try again.")),
          });
        }}
        onCancel={() => {
          setRefundOpen(false);
          setRefundError(null);
        }}
      />
    </div>
  );
}
