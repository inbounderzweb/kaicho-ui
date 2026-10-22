"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAdminOrderDetail } from "@/lib/hooks/admin/useAdminOrderDetail";
import { useUpdateOrderStatus } from "@/lib/hooks/admin/useUpdateOrderStatus";
import { useSaveOrderShipment } from "@/lib/hooks/admin/useSaveOrderShipment";
import { useUpdateOrderShipmentStatus } from "@/lib/hooks/admin/useUpdateOrderShipmentStatus";
import { useResendOrderStatusEmail } from "@/lib/hooks/admin/useResendOrderStatusEmail";
import { resolveMediaUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import {
  ORDER_STATUS_LABELS,
  SHIPMENT_STATUSES,
  SHIPMENT_STATUS_LABELS,
  type OrderStatus,
  type ShipmentStatus,
} from "@/lib/api/order";
import type { AdminOrderDetail, EmailNotification, SaveShipmentInput } from "@/lib/api/admin";
import { nextStatuses } from "@/lib/api/orderTransitions";
import { canEmailCustomer, orderStatusAfterShipment, shipmentChangeEmails, statusChangeEmails } from "@/lib/api/orderEmail";
import EmailConsentModal from "./EmailConsentModal";
import { OrderStatusBadge, PaymentStatusBadge, ShipmentStatusBadge } from "./OrderStatusBadge";
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

// Shown right after an admin saves a change that can email the customer. It
// tells them exactly what happened — saved and emailed, saved without an email,
// or saved but the email failed (with a safe retry: the server won't send a
// second copy of a mail that already went out).
function EmailOutcomeNote({ id, outcome }: { id: string; outcome?: EmailNotification }) {
  const resend = useResendOrderStatusEmail(id);
  const shown = resend.data?.emailNotification ?? outcome;
  if (!shown || shown.state === "not_applicable") return null;

  const tone =
    shown.state === "sent"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : shown.state === "not_requested"
        ? "bg-black/5 text-black/70 dark:bg-white/10 dark:text-white/70"
        : "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  const headline =
    shown.state === "sent"
      ? "Saved and email sent successfully."
      : shown.state === "not_requested"
        ? "Saved without sending an email."
        : shown.state === "failed"
          ? "Saved successfully, but email sending failed."
          : "Saved successfully. No email was sent.";

  return (
    <div role="status" className={`space-y-2 rounded-xl p-3 text-xs font-semibold ${tone}`}>
      <p>
        {shown.state === "sent" ? "✓ " : shown.state === "not_requested" ? "" : "⚠ "}
        {headline}
        {shown.state !== "not_requested" && shown.message ? ` ${shown.message}` : ""}
      </p>
      {resend.isError && <p>{messageOf(resend.error, "Couldn't retry the email. Please try again.")}</p>}
      {shown.state === "failed" && (
        <button
          type="button"
          onClick={() => resend.mutate()}
          disabled={resend.isPending}
          className="rounded-full border border-current px-3 py-1 text-xs font-semibold disabled:opacity-50"
        >
          {resend.isPending ? "Retrying…" : "Retry sending email"}
        </button>
      )}
    </div>
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function OrderDetailClient({ id }: { id: string }) {
  const { data: order, isLoading, isError, error, refetch } = useAdminOrderDetail(id);
  const statusMutation = useUpdateOrderStatus(id);

  // "" = nothing chosen yet → the dropdown shows the order's current status.
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  // The change waiting on the admin's permission popup.
  const [pendingStatus, setPendingStatus] = useState<{ status: OrderStatus; note?: string } | null>(null);

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
  const selectedStatus: OrderStatus = nextStatus || order.status;
  const statusChanged = selectedStatus !== order.status;

  // `sendEmail` is the admin's explicit answer; the server only emails on `true`.
  const saveStatus = (change: { status: OrderStatus; note?: string }, sendEmail: boolean) => {
    if (statusMutation.isPending) return;
    statusMutation.mutate(
      { ...change, sendEmail },
      {
        onSuccess: () => {
          setNextStatus("");
          setStatusNote("");
        },
        onSettled: () => setPendingStatus(null),
      }
    );
  };
  const customerName = order.customer?.name || order.customer?.phone || order.customer?.userId || "—";
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
          <Link
            href={`/admin/orders/${id}/receipt`}
            className="inline-flex rounded-full bg-admin-primary px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Make receipt
          </Link>
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
                    {item.selectionType === "PACK" && item.packBreakdown?.length ? (
                      <p className="mt-0.5 text-xs tabular-nums text-black/55 dark:text-white/55">
                        {item.packBreakdown.map((l) => `${l.packName} × ${l.packCount}`).join(" + ")}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs tabular-nums text-black/55 dark:text-white/55">
                        {item.quantity} × {currency.format(item.unitPrice)}
                      </p>
                    )}
                    {(item.freeQuantity ?? 0) > 0 && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        {item.freeQuantity} FREE · BOGO (−{currency.format(item.offerDiscount ?? 0)})
                      </p>
                    )}
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
              {Number(order.pricing.offerDiscountTotal ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>{order.offer?.name ?? "BOGO Offer"} ({order.offer?.freeUnits ?? 0} free)</span>
                  <span className="tabular-nums">− {currency.format(Number(order.pricing.offerDiscountTotal))}</span>
                </div>
              )}
              {order.coupon && (Number(order.pricing.discountTotal) > 0 || order.coupon.freeDelivery) && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Coupon ({order.coupon.code})</span>
                  <span className="tabular-nums">
                    {order.coupon.freeDelivery && !Number(order.pricing.discountTotal)
                      ? "Free delivery"
                      : `− ${currency.format(Number(order.pricing.discountTotal))}`}
                  </span>
                </div>
              )}
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
            {order.customer?.email ? (
              <p className="text-sm text-black/60 dark:text-white/60">
                {order.customer.email}{" "}
                <span
                  className={`text-xs font-semibold ${
                    order.customer.emailVerified ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {order.customer.emailVerified ? "· Verified" : "· Not verified — status emails won't be sent"}
                </span>
              </p>
            ) : (
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                No email on file — status emails can&apos;t be sent to this customer.
              </p>
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
            {(() => {
              const a = order.shippingAddress;
              const structured = Boolean(a.houseNo || a.area);
              const street = structured
                ? [a.houseNo, a.building].filter(Boolean).join(", ")
                : a.line1;
              const area = structured ? a.area : a.line2;
              return (
                <div className="text-sm text-black/60 dark:text-white/60">
                  {(a.receiverName || a.receiverPhone) && (
                    <p className="font-semibold text-black dark:text-white">
                      {a.receiverName}
                      {a.receiverName && a.receiverPhone ? " · " : ""}
                      {a.receiverPhone}
                    </p>
                  )}
                  {street && <p>{street}</p>}
                  {area && <p>{area}</p>}
                  {a.landmark && <p>Landmark: {a.landmark}</p>}
                  <p>
                    {a.city}, {a.state} {a.pincode}
                  </p>
                </div>
              );
            })()}
          </section>

          {/* Status update */}
          <section className={`space-y-3 ${cardClass}`}>
            <h2 className={sectionTitleClass}>Update status</h2>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setNextStatus(e.target.value as OrderStatus);
                statusMutation.reset();
              }}
              disabled={allowedNext.length === 0}
              aria-label="Order status"
              className={inputClass}
            >
              {/* The current status is always shown first, so the admin sees
                  where the order is before choosing where it goes next. */}
              <option value={order.status}>{ORDER_STATUS_LABELS[order.status]} (current)</option>
              {allowedNext.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {allowedNext.length === 0 ? (
              <p className="text-sm text-black/55 dark:text-white/55">
                {ORDER_STATUS_LABELS[order.status]} is a final state — no further transitions.
              </p>
            ) : (
              <>
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
                {statusMutation.isSuccess && <EmailOutcomeNote id={id} outcome={statusMutation.data?.emailNotification} />}
                <button
                  type="button"
                  disabled={!statusChanged || statusMutation.isPending}
                  onClick={() => {
                    if (!statusChanged) return;
                    const change = { status: selectedStatus, note: statusNote.trim() || undefined };
                    // Ask permission only when an email could actually go out; otherwise save quietly.
                    if (statusChangeEmails(order.status, selectedStatus) && canEmailCustomer(order.customer)) setPendingStatus(change);
                    else saveStatus(change, false);
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

          {canEmailCustomer(order.customer) && (
            <EmailConsentModal
              open={pendingStatus !== null}
              customerEmail={order.customer.email}
              summary={
                pendingStatus
                  ? [
                      `Order status: ${ORDER_STATUS_LABELS[order.status]} → ${ORDER_STATUS_LABELS[pendingStatus.status]}`,
                      ...(pendingStatus.note ? [`Note: ${pendingStatus.note}`] : []),
                    ]
                  : []
              }
              busy={statusMutation.isPending}
              onSave={(sendEmail) => pendingStatus && saveStatus(pendingStatus, sendEmail)}
              onCancel={() => setPendingStatus(null)}
            />
          )}

        </div>
      </div>
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
    status: (shipment?.status ?? "SHIPPED") as ShipmentStatus,
  }));
  // "" = nothing chosen yet → the dropdown shows the shipment's current status.
  const [quickStatus, setQuickStatus] = useState<ShipmentStatus | "">("");
  const [quickNote, setQuickNote] = useState("");
  // The shipment change waiting on the admin's permission popup.
  type PendingShipment =
    | { kind: "save"; payload: SaveShipmentInput }
    | { kind: "quick"; status: ShipmentStatus; note?: string };
  const [pending, setPending] = useState<PendingShipment | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectedShipmentStatus: ShipmentStatus | "" = quickStatus || shipment?.status || "";
  const shipmentStatusChanged = Boolean(quickStatus) && quickStatus !== shipment?.status;

  const trackingValid = TRACKING_NUMBER_RE.test(form.trackingNumber.trim());
  const carrierValid = form.carrier.trim().length >= 2;
  const formValid = trackingValid && carrierValid;

  // Shipping date isn't hand-entered: the server stamps `shippedAt` with "now"
  // the moment the shipment is created or its status moves into a shipped-like
  // state (see shipment.service.ts), so we never send it from here.
  const emailable = canEmailCustomer(order.customer);

  const runSave = (payload: SaveShipmentInput, sendEmail: boolean) => {
    if (saveMutation.isPending) return;
    saveMutation.mutate(
      { ...payload, sendEmail },
      { onSuccess: () => setEditing(false), onSettled: () => setPending(null) }
    );
  };
  const runQuick = (status: ShipmentStatus, note: string | undefined, sendEmail: boolean) => {
    if (statusMutation.isPending) return;
    statusMutation.mutate(
      { status, note, sendEmail },
      {
        onSuccess: () => {
          setQuickStatus("");
          setQuickNote("");
        },
        onSettled: () => setPending(null),
      }
    );
  };

  // Shipping date isn't hand-entered: the server stamps `shippedAt` with "now"
  // the moment the shipment is created or its status moves into a shipped-like
  // state (see shipment.service.ts), so we never send it from here.
  const submit = () => {
    if (!formValid) return;
    const payload: SaveShipmentInput = {
      carrier: form.carrier.trim(),
      trackingNumber: form.trackingNumber.trim(),
      status: form.status,
    };
    // Ask permission only when this save would move the order to a status that emails the customer.
    if (emailable && shipmentChangeEmails(order.status, form.status)) setPending({ kind: "save", payload });
    else runSave(payload, false);
  };

  const pendingSummary = (): string[] => {
    if (!pending) return [];
    if (pending.kind === "save") {
      return [
        `Shipment: ${form.carrier.trim()} · ${form.trackingNumber.trim()}`,
        `Shipping status: ${SHIPMENT_STATUS_LABELS[form.status]}`,
        `Order status: ${ORDER_STATUS_LABELS[order.status]} → ${ORDER_STATUS_LABELS[orderStatusAfterShipment(order.status, form.status)]}`,
      ];
    }
    return [
      `Shipping status: ${shipment ? SHIPMENT_STATUS_LABELS[shipment.status] : "—"} → ${SHIPMENT_STATUS_LABELS[pending.status]}`,
      `Order status: ${ORDER_STATUS_LABELS[order.status]} → ${ORDER_STATUS_LABELS[orderStatusAfterShipment(order.status, pending.status)]}`,
      ...(pending.note ? [`Note: ${pending.note}`] : []),
    ];
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
          {saveMutation.isSuccess && <EmailOutcomeNote id={id} outcome={saveMutation.data?.emailNotification} />}
          <dl className="space-y-1.5 text-sm">
            <ShipmentRow label="Courier" value={shipment.carrier} />
            <ShipmentRow label="AWB / Tracking" value={shipment.trackingNumber} />
            <ShipmentRow label="Shipped" value={formatDateTime(shipment.shippedAt ?? order.createdAt)} />
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
              value={selectedShipmentStatus}
              onChange={(e) => {
                setQuickStatus(e.target.value as ShipmentStatus);
                statusMutation.reset();
              }}
              aria-label="Shipping status"
              className={inputClass}
            >
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SHIPMENT_STATUS_LABELS[s]}
                  {s === shipment.status ? " (current)" : ""}
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
            {statusMutation.isSuccess && <EmailOutcomeNote id={id} outcome={statusMutation.data?.emailNotification} />}
            <button
              type="button"
              disabled={!shipmentStatusChanged || statusMutation.isPending}
              onClick={() => {
                if (!quickStatus || !shipmentStatusChanged) return;
                const note = quickNote.trim() || undefined;
                if (emailable && shipmentChangeEmails(order.status, quickStatus)) setPending({ kind: "quick", status: quickStatus, note });
                else runQuick(quickStatus, note, false);
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

      {canEmailCustomer(order.customer) && (
        <EmailConsentModal
          open={pending !== null}
          customerEmail={order.customer.email}
          summary={pendingSummary()}
          busy={saveMutation.isPending || statusMutation.isPending}
          onSave={(sendEmail) => {
            if (!pending) return;
            if (pending.kind === "save") runSave(pending.payload, sendEmail);
            else runQuick(pending.status, pending.note, sendEmail);
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </section>
  );
}
