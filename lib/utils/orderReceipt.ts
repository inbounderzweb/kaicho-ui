import type { AdminOrderDetail } from "../api/admin";
import type { OrderAddress, OrderItem } from "../api/order";

// The same business details displayed in the storefront footer.
export const receiptBusiness = {
  name: "Kaicho Foods",
  address: [
    "No.EKP.8/293, Kayapoyil, Kakkara PO, Via MM Bazar",
    "Kannur, Kerala – 670306, India",
  ],
  email: "hello@kaicho.in",
  phone: "+91 87927 99631",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatReceiptCurrency(amount: number): string {
  return currency.format(amount);
}

export function formatReceiptDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function getReceiptAddressLines(address: OrderAddress): string[] {
  const structured = Boolean(address.houseNo || address.area);
  return [
    structured ? [address.houseNo, address.building].filter(Boolean).join(", ") : address.line1,
    structured ? address.area : address.line2,
    address.landmark ? `Landmark: ${address.landmark}` : undefined,
    [address.city, address.state].filter(Boolean).join(", "),
    address.pincode,
  ].filter((line): line is string => Boolean(line));
}

export interface ReceiptItem {
  key: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  detail?: string;
}

export function getReceiptItems(items: OrderItem[]): ReceiptItem[] {
  return items.flatMap((item, itemIndex) => {
    const packs = item.selectionType === "PACK" ? item.packBreakdown : undefined;
    const packTotalMinor = packs?.reduce(
      (total, pack) => total + Math.round(pack.packPrice * 100) * pack.packCount,
      0
    );
    // Use pack rates instead of the rounded blended per-unit rate. Fall
    // back to the saved item total if an older snapshot does not reconcile.
    if (packs?.length && packTotalMinor === Math.round(item.lineTotal * 100)) {
      return packs.map((pack, packIndex) => ({
        key: `${item.productId}-${itemIndex}-${pack.packId}-${packIndex}`,
        name: item.name,
        sku: item.sku,
        quantity: pack.packCount,
        unitPrice: pack.packPrice,
        lineTotal: (Math.round(pack.packPrice * 100) * pack.packCount) / 100,
        detail: `${pack.packName} · ${pack.packQuantity} unit${pack.packQuantity === 1 ? "" : "s"} per pack`,
      }));
    }
    return [{
      key: `${item.productId}-${itemIndex}`,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      detail: packs?.length
        ? `${packs.map((pack) => `${pack.packName} × ${pack.packCount}`).join(" + ")} · average unit rate`
        : undefined,
    }];
  });
}

export interface ReceiptPaymentSummary {
  amountPaid: number;
  refundedAmount: number | null;
  netReceived: number | null;
  balanceDue: number;
  note: string;
}

export function getReceiptPaymentSummary(order: AdminOrderDetail): ReceiptPaymentSummary {
  const total = order.pricing.grandTotal;
  const captured = ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"].includes(order.paymentStatus);
  const amountPaid = captured ? total : 0;
  const recordedRefund = order.payment?.refundedAmount;
  const refundedAmount = order.paymentStatus === "REFUNDED"
    ? total
    : order.paymentStatus === "PARTIALLY_REFUNDED"
      ? typeof recordedRefund === "number" && Number.isFinite(recordedRefund) && recordedRefund > 0 && recordedRefund < total
        ? recordedRefund
        : null
      : 0;
  const closedWithoutCollection = ["CANCELLED", "RETURNED", "REFUNDED"].includes(order.status);
  const balanceDue = captured || closedWithoutCollection ? 0 : total;

  let note: string;
  if (order.paymentStatus === "REFUNDED") {
    note = "Payment fully refunded.";
  } else if (order.paymentStatus === "PARTIALLY_REFUNDED") {
    note = refundedAmount === null
      ? "Payment partially refunded; the refund amount is not recorded."
      : "Payment partially refunded. The refund amount is shown in the payment details.";
  } else if (captured) {
    note = "Payment received.";
  } else if (closedWithoutCollection) {
    note = "No payment is recorded. No balance is due for this closed order.";
  } else if (order.paymentMethod === "COD") {
    note = "Cash on delivery. Collection has not been recorded.";
  } else if (order.paymentStatus === "FAILED") {
    note = "Payment failed. No payment has been received.";
  } else {
    note = "Payment pending. No payment has been received.";
  }

  return {
    amountPaid,
    refundedAmount,
    netReceived: refundedAmount === null ? null : (Math.round(amountPaid * 100) - Math.round(refundedAmount * 100)) / 100,
    balanceDue,
    note,
  };
}
