"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/ApiError";
import type { AdminOrderDetail } from "@/lib/api/admin";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/api/order";
import { useAdminOrderDetail } from "@/lib/hooks/admin/useAdminOrderDetail";
import {
  formatReceiptCurrency,
  formatReceiptDate,
  getReceiptAddressLines,
  getReceiptItems,
  getReceiptPaymentSummary,
  receiptBusiness,
} from "@/lib/utils/orderReceipt";
import { IconChevronLeft } from "../ui/icons";
import styles from "./OrderReceipt.module.css";

export default function OrderReceiptClient({ id }: { id: string }) {
  const { data: order, isLoading, isError, error, refetch } = useAdminOrderDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading receipt">
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
          ? "You don't have permission to make a receipt for this order."
          : "Couldn't load this receipt.";

    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <p className="text-sm font-semibold" role="alert">{message}</p>
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

  return <ReceiptEditor key={order.orderId} order={order} />;
}

function ReceiptEditor({ order }: { order: AdminOrderDetail }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Receipt ${order.orderNumber} | Kaicho Foods`;
    return () => {
      document.title = previousTitle;
    };
  }, [order.orderNumber]);

  const items = getReceiptItems(order.items);
  const addressLines = getReceiptAddressLines(order.shippingAddress);
  const payment = getReceiptPaymentSummary(order);
  const hasRefund = order.paymentStatus === "REFUNDED" || order.paymentStatus === "PARTIALLY_REFUNDED";
  const customerName = order.shippingAddress.receiverName || order.customer?.name || "Customer";
  const customerPhone = order.shippingAddress.receiverPhone || order.customer?.phone;
  const receiptDate = order.payment?.paidAt ?? order.createdAt;
  const discount = Number(order.pricing.discountTotal ?? 0);

  return (
    <div className={styles.page}>
      <div className="space-y-5" data-receipt-controls>
        <Link
          href={`/admin/orders/${encodeURIComponent(order.orderId)}`}
          className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Back to order {order.orderNumber}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold sm:text-2xl">Make receipt</h1>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">
              Preview the receipt, then print or save a PDF.
            </p>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Print / Save PDF
            </button>
            <p className="text-xs text-black/55 dark:text-white/55">
              Choose “Save as PDF” in the print dialog.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-admin-border bg-admin-card p-4 dark:border-admin-border-dark dark:bg-admin-card-dark">
          <label htmlFor="receipt-note" className="block text-sm font-semibold">
            Receipt note <span className="font-normal text-black/55 dark:text-white/55">(optional)</span>
          </label>
          <textarea
            id="receipt-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Add a message or payment reference…"
            aria-describedby="receipt-note-help"
            className="mt-2 w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark"
          />
          <p id="receipt-note-help" className="mt-1 text-xs text-black/55 dark:text-white/55">
            Included in this receipt only; not saved to the order.
          </p>
        </div>
      </div>

      <article className={styles.document} data-order-receipt aria-label={`Receipt for order ${order.orderNumber}`}>
        <header className={styles.receiptHeader}>
          <div>
            <p className={styles.businessName}>{receiptBusiness.name}</p>
            <address className={styles.address}>
              {receiptBusiness.address.map((line) => <span key={line}>{line}</span>)}
              <span>{receiptBusiness.email}</span>
              <span>{receiptBusiness.phone}</span>
            </address>
          </div>
          <div className={styles.receiptIdentity}>
            <h2>Receipt</h2>
            <p className={styles.receiptNumber}>RCPT-{order.orderNumber}</p>
            <dl className={styles.metadata}>
              <div><dt>Receipt date</dt><dd>{formatReceiptDate(receiptDate)}</dd></div>
              <div><dt>Order number</dt><dd>{order.orderNumber}</dd></div>
              <div><dt>Order date</dt><dd>{formatReceiptDate(order.createdAt)}</dd></div>
              <div><dt>Order status</dt><dd>{ORDER_STATUS_LABELS[order.status] ?? order.status}</dd></div>
            </dl>
          </div>
        </header>

        <section className={styles.customer} aria-labelledby="receipt-customer-title">
          <h3 id="receipt-customer-title" className={styles.sectionTitle}>Customer / Delivery address</h3>
          <p className={styles.customerName}>{customerName}</p>
          <address className={styles.address}>
            {addressLines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
            {customerPhone && <span>Phone: {customerPhone}</span>}
            {order.customer?.email && <span>Email: {order.customer.email}</span>}
          </address>
        </section>

        <div className={styles.tableWrapper}>
          <table className={styles.items}>
            <caption className="sr-only">Order items and recorded prices in Indian rupees</caption>
            <thead>
              <tr>
                <th scope="col" className={styles.rowNumber}>#</th>
                <th scope="col">Item / SKU</th>
                <th scope="col" className={styles.numeric}>Qty</th>
                <th scope="col" className={styles.numeric}>Rate</th>
                <th scope="col" className={styles.numeric}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.key}>
                  <td className={styles.rowNumber}>{index + 1}</td>
                  <td>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemDetail}>SKU: {item.sku || "—"}</p>
                    {item.detail && <p className={styles.itemDetail}>{item.detail}</p>}
                  </td>
                  <td className={styles.numeric}>{item.quantity}</td>
                  <td className={styles.numeric}>{formatReceiptCurrency(item.unitPrice)}</td>
                  <td className={styles.numeric}>{formatReceiptCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.summary}>
          <section className={styles.payment} aria-labelledby="receipt-payment-title">
            <h3 id="receipt-payment-title" className={styles.sectionTitle}>Payment details</h3>
            <dl className={styles.metadata}>
              <div><dt>Method</dt><dd>{order.paymentMethod === "COD" ? "Cash on delivery" : "Razorpay"}</dd></div>
              <div><dt>Status</dt><dd>{PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}</dd></div>
              <div><dt>Amount received</dt><dd>{formatReceiptCurrency(payment.amountPaid)}</dd></div>
              {hasRefund && (
                <>
                  <div><dt>Refunded amount</dt><dd>{payment.refundedAmount === null ? "Not recorded" : formatReceiptCurrency(payment.refundedAmount)}</dd></div>
                  <div><dt>Net received</dt><dd>{payment.netReceived === null ? "Not recorded" : formatReceiptCurrency(payment.netReceived)}</dd></div>
                </>
              )}
              <div><dt>Balance due</dt><dd>{formatReceiptCurrency(payment.balanceDue)}</dd></div>
            </dl>
            <p className={styles.paymentNote}>{payment.note}</p>
          </section>

          <dl className={styles.totals} aria-label="Receipt totals">
            <div><dt>Subtotal</dt><dd>{formatReceiptCurrency(order.pricing.subtotal)}</dd></div>
            <div>
              <dt>Discount{order.coupon ? ` (${order.coupon.code})` : ""}</dt>
              <dd>{discount > 0 ? "− " : ""}{formatReceiptCurrency(discount)}</dd>
            </div>
            <div><dt>Shipping{order.coupon?.freeDelivery ? " (free delivery)" : ""}</dt><dd>{formatReceiptCurrency(order.pricing.shippingFee)}</dd></div>
            <div><dt>Tax</dt><dd>{formatReceiptCurrency(order.pricing.taxTotal)}</dd></div>
            <div className={styles.grandTotal}><dt>Grand total</dt><dd>{formatReceiptCurrency(order.pricing.grandTotal)}</dd></div>
          </dl>
        </div>

        {note.trim() && (
          <section className={styles.note} aria-labelledby="receipt-note-title">
            <h3 id="receipt-note-title" className={styles.sectionTitle}>Note</h3>
            <p>{note.trim()}</p>
          </section>
        )}

        <footer className={styles.receiptFooter}>
          <p>Thank you for your order.</p>
          <p>All amounts are in INR.</p>
        </footer>
      </article>
    </div>
  );
}
