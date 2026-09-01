"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAdminOrderDetail } from "@/lib/hooks/admin/useAdminOrderDetail";
import { useUpdateOrderStatus } from "@/lib/hooks/admin/useUpdateOrderStatus";
import { useRefundOrder } from "@/lib/hooks/admin/useRefundOrder";
import { useSaveOrderShipment } from "@/lib/hooks/admin/useSaveOrderShipment";
import { useUpdateOrderShipmentStatus } from "@/lib/hooks/admin/useUpdateOrderShipmentStatus";
import { resolveMediaUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import {
  ORDER_STATUS_LABELS,
  SHIPMENT_STATUSES,
  SHIPMENT_STATUS_LABELS,
  type OrderStatus,
  type ShipmentStatus,
} from "@/lib/api/order";
import type { AdminOrderDetail, SaveShipmentInput } from "@/lib/api/admin";
import { nextStatuses } from "@/lib/api/orderTransitions";
import { OrderStatusBadge, PaymentStatusBadge, ShipmentStatusBadge } from "./OrderStatusBadge";
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

          {/* Shipment */}
          <ShipmentSection id={id} order={order} />

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

const COMMON_CARRIERS = [
  "Delhivery",
  "Blue Dart",
  "DTDC",
  "XpressBees",
  "Ekart Logistics",
  "India Post",
  "Shadowfax",
  "Ecom Express",
  "Amazon Shipping",
  "Shiprocket",
];

// Mirrors kaicho-be's TRACKING_NUMBER_RE — the server re-validates.
const TRACKING_NUMBER_RE = /^[A-Za-z0-9-]{4,40}$/;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

function ShipmentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-black/55 dark:text-white/55">{label}</dt>
      <dd className="text-right font-medium break-all">{value}</dd>
    </div>
  );
}

function ShipmentField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">
        {label}
      </span>
      {children}
      {error && <span className="block text-xs font-semibold text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}

function ShipmentSection({ id, order }: { id: string; order: AdminOrderDetail }) {
  const shipment = order.shipment;
  const saveMutation = useSaveOrderShipment(id);
  const statusMutation = useUpdateOrderShipmentStatus(id);

  const [editing, setEditing] = useState(!shipment);
  const [form, setForm] = useState(() => ({
    carrier: shipment?.carrier ?? "",
    trackingNumber: shipment?.trackingNumber ?? "",
    shipmentId: shipment?.shipmentId ?? "",
    trackingUrl: shipment?.trackingUrl ?? "",
    shippedAt: toDateInput(shipment?.shippedAt ?? null),
    estimatedDeliveryAt: toDateInput(shipment?.estimatedDeliveryAt ?? null),
    status: (shipment?.status ?? "SHIPPED") as ShipmentStatus,
  }));
  const [quickStatus, setQuickStatus] = useState<ShipmentStatus | "">("");
  const [quickNote, setQuickNote] = useState("");

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const trackingValid = TRACKING_NUMBER_RE.test(form.trackingNumber.trim());
  const carrierValid = form.carrier.trim().length >= 2;
  const urlValid = form.trackingUrl.trim() === "" || isHttpUrl(form.trackingUrl.trim());
  const datesValid =
    !form.shippedAt || !form.estimatedDeliveryAt || form.estimatedDeliveryAt >= form.shippedAt;
  const formValid = trackingValid && carrierValid && urlValid && datesValid;

  const submit = () => {
    if (!formValid) return;
    const payload: SaveShipmentInput = {
      carrier: form.carrier.trim(),
      trackingNumber: form.trackingNumber.trim(),
      status: form.status,
    };
    if (form.shipmentId.trim()) payload.shipmentId = form.shipmentId.trim();
    if (form.trackingUrl.trim()) payload.trackingUrl = form.trackingUrl.trim();
    if (form.shippedAt) payload.shippedAt = form.shippedAt;
    if (form.estimatedDeliveryAt) payload.estimatedDeliveryAt = form.estimatedDeliveryAt;
    saveMutation.mutate(payload, { onSuccess: () => setEditing(false) });
  };

  return (
    <section className={`space-y-3 ${cardClass}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={sectionTitleClass}>Shipment</h2>
        {shipment && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Edit details
          </button>
        )}
      </div>

      {shipment && !editing ? (
        <>
          <dl className="space-y-1.5 text-sm">
            <ShipmentRow label="Courier" value={shipment.carrier} />
            <ShipmentRow label="AWB / Tracking" value={shipment.trackingNumber} />
            {shipment.shipmentId && <ShipmentRow label="Shipment ID" value={shipment.shipmentId} />}
            {shipment.estimatedDeliveryAt && (
              <ShipmentRow label="Expected" value={formatDateTime(shipment.estimatedDeliveryAt)} />
            )}
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <ShipmentStatusBadge status={shipment.status} />
            {shipment.trackingUrl && (
              <a
                href={shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-black/60 underline hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                Open tracking ↗
              </a>
            )}
          </div>

          <div className="space-y-2 border-t border-admin-border pt-3 dark:border-admin-border-dark">
            <select
              value={quickStatus}
              onChange={(e) => setQuickStatus(e.target.value as ShipmentStatus | "")}
              className={inputClass}
            >
              <option value="">Update shipping status…</option>
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SHIPMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <input
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              maxLength={300}
              placeholder="Note (optional)"
              className={inputClass}
            />
            {statusMutation.isError && (
              <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                {messageOf(statusMutation.error, "Couldn't update the shipping status.")}
              </p>
            )}
            <button
              type="button"
              disabled={!quickStatus || statusMutation.isPending}
              onClick={() => {
                if (!quickStatus) return;
                statusMutation.mutate(
                  { status: quickStatus, note: quickNote.trim() || undefined },
                  {
                    onSuccess: () => {
                      setQuickStatus("");
                      setQuickNote("");
                    },
                  }
                );
              }}
              className="w-full rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {statusMutation.isPending ? "Updating…" : "Update shipping status"}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <ShipmentField label="Delivery partner / courier *">
            <input
              list="carrier-options"
              value={form.carrier}
              onChange={(e) => set("carrier", e.target.value)}
              placeholder="e.g. Delhivery"
              className={inputClass}
            />
            <datalist id="carrier-options">
              {COMMON_CARRIERS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </ShipmentField>
          <ShipmentField
            label="AWB / tracking number *"
            error={form.trackingNumber !== "" && !trackingValid ? "4–40 letters, digits or hyphens" : undefined}
          >
            <input
              value={form.trackingNumber}
              onChange={(e) => set("trackingNumber", e.target.value)}
              className={inputClass}
            />
          </ShipmentField>
          <ShipmentField label="Shipment ID">
            <input
              value={form.shipmentId}
              onChange={(e) => set("shipmentId", e.target.value)}
              className={inputClass}
            />
          </ShipmentField>
          <div className="grid grid-cols-2 gap-2">
            <ShipmentField label="Shipping date">
              <input
                type="date"
                value={form.shippedAt}
                onChange={(e) => set("shippedAt", e.target.value)}
                className={inputClass}
              />
            </ShipmentField>
            <ShipmentField label="Expected delivery" error={!datesValid ? "Before shipping date" : undefined}>
              <input
                type="date"
                value={form.estimatedDeliveryAt}
                onChange={(e) => set("estimatedDeliveryAt", e.target.value)}
                className={inputClass}
              />
            </ShipmentField>
          </div>
          <ShipmentField
            label="Tracking URL"
            error={!urlValid ? "Must start with http:// or https://" : undefined}
          >
            <input
              type="url"
              value={form.trackingUrl}
              onChange={(e) => set("trackingUrl", e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </ShipmentField>
          <ShipmentField label="Shipping status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as ShipmentStatus)}
              className={inputClass}
            >
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SHIPMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </ShipmentField>

          {saveMutation.isError && (
            <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
              {messageOf(saveMutation.error, "Couldn't save the shipping details.")}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!formValid || saveMutation.isPending}
              onClick={submit}
              className="flex-1 rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : "Save shipping details"}
            </button>
            {shipment && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-admin-border px-4 py-2.5 text-sm font-semibold dark:border-admin-border-dark"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
