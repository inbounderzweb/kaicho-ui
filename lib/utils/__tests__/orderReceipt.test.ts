import { describe, expect, it } from "vitest";
import type { AdminOrderDetail } from "../../api/admin";
import type { OrderItem } from "../../api/order";
import {
  formatReceiptCurrency,
  formatReceiptDate,
  getReceiptAddressLines,
  getReceiptItems,
  getReceiptPaymentSummary,
} from "../orderReceipt";

function item(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    productId: "product-1",
    name: "Millet porridge",
    sku: "MILLET-01",
    imageUrl: null,
    quantity: 3,
    unitPrice: 33.33,
    mrp: 40,
    discount: 6.67,
    discountPercentage: 16.68,
    lineTotal: 100,
    ...overrides,
  };
}

function order(overrides: Partial<AdminOrderDetail> = {}): AdminOrderDetail {
  return {
    orderId: "order-1",
    orderNumber: "ORD-20261006-ABC234",
    items: [item()],
    pricing: { subtotal: 100, shippingFee: 0, taxTotal: 0, grandTotal: 100 },
    shippingAddress: { city: "Kannur", state: "Kerala", pincode: "670306" },
    status: "CONFIRMED",
    paymentMethod: "RAZORPAY",
    paymentStatus: "PAID",
    statusHistory: [],
    shipment: null,
    createdAt: "2026-10-06T00:00:00.000Z",
    updatedAt: "2026-10-06T00:00:00.000Z",
    ...overrides,
  };
}

describe("receipt item prices", () => {
  it("uses the pack price when the rounded blended unit rate would understate the purchase", () => {
    const rows = getReceiptItems([
      item({
        selectionType: "PACK",
        packBreakdown: [
          { packId: "pack-3", packName: "Starter pack", packQuantity: 3, packCount: 1, packPrice: 100 },
        ],
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "Millet porridge",
      sku: "MILLET-01",
      quantity: 1,
      unitPrice: 100,
      lineTotal: 100,
      detail: "Starter pack · 3 units per pack",
    });
  });

  it("keeps distinct mixed pack quantities and rates and reconciles to the saved subtotal", () => {
    const savedOrder = order({
      items: [
        item({
          quantity: 18,
          unitPrice: 19.44,
          lineTotal: 349.83,
          selectionType: "PACK",
          packBreakdown: [
            { packId: "pack-6", packName: "Family pack", packQuantity: 6, packCount: 2, packPrice: 99.99 },
            { packId: "pack-2", packName: "Mini pack", packQuantity: 2, packCount: 3, packPrice: 49.95 },
          ],
        }),
      ],
      pricing: { subtotal: 349.83, discountTotal: 25, shippingFee: 49, taxTotal: 0, grandTotal: 373.83 },
    });
    const rows = getReceiptItems(savedOrder.items);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ quantity: 2, unitPrice: 99.99, lineTotal: 199.98 });
    expect(rows[1]).toMatchObject({ quantity: 3, unitPrice: 49.95, lineTotal: 149.85 });
    expect(rows.reduce((total, row) => total + row.lineTotal, 0)).toBeCloseTo(savedOrder.pricing.subtotal, 2);
    expect(savedOrder.items[0].lineTotal).toBe(349.83);
    expect(savedOrder.pricing.grandTotal).toBe(373.83);
  });

  it("preserves legacy unit item totals without a pack selection", () => {
    const rows = getReceiptItems([item({ quantity: 3, unitPrice: 10, lineTotal: 29.99 })]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ quantity: 3, unitPrice: 10, lineTotal: 29.99 });
    expect(rows[0].detail).toBeUndefined();
  });

  it("falls back to the recorded item total when an older pack breakdown does not reconcile", () => {
    const rows = getReceiptItems([
      item({
        quantity: 6,
        unitPrice: 16.67,
        lineTotal: 100,
        selectionType: "PACK",
        packBreakdown: [
          { packId: "pack-3", packName: "Starter pack", packQuantity: 3, packCount: 2, packPrice: 55 },
        ],
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ quantity: 6, unitPrice: 16.67, lineTotal: 100 });
    expect(rows[0].detail).toContain("Starter pack × 2");
  });

  it("preserves the saved total for pack selections with no surviving breakdown", () => {
    const rows = getReceiptItems([item({ selectionType: "PACK", packBreakdown: [] })]);

    expect(rows).toHaveLength(1);
    expect(rows[0].lineTotal).toBe(100);
  });
});

describe("receipt shipping address", () => {
  it("prints structured fields without duplicating their derived legacy address lines", () => {
    expect(getReceiptAddressLines({
      houseNo: "12",
      building: "Lotus Apartments",
      area: "Market Road",
      landmark: "Near the library",
      line1: "12, Lotus Apartments",
      line2: "Market Road",
      city: "Kannur",
      state: "Kerala",
      pincode: "670306",
    })).toEqual([
      "12, Lotus Apartments",
      "Market Road",
      "Landmark: Near the library",
      "Kannur, Kerala",
      "670306",
    ]);
  });

  it("retains legacy shipping addresses and skips missing optional lines", () => {
    expect(getReceiptAddressLines({
      line1: "12 Market Road",
      line2: "Town centre",
      city: "Kannur",
      state: "Kerala",
      pincode: "670306",
    })).toEqual(["12 Market Road", "Town centre", "Kannur, Kerala", "670306"]);

    expect(getReceiptAddressLines({ city: "Kannur", state: "Kerala", pincode: "670306" }))
      .toEqual(["Kannur, Kerala", "670306"]);
  });
});

describe("receipt payment amounts", () => {
  it("recognizes a paid order when an older response omits optional payment details", () => {
    expect(getReceiptPaymentSummary(order())).toMatchObject({
      amountPaid: 100,
      refundedAmount: 0,
      netReceived: 100,
      balanceDue: 0,
    });
  });

  it.each(["PENDING", "FAILED"] as const)("shows no payment received for online payment status %s", (paymentStatus) => {
    const summary = getReceiptPaymentSummary(order({ status: "PENDING_PAYMENT", paymentStatus }));

    expect(summary).toMatchObject({ amountPaid: 0, refundedAmount: 0, netReceived: 0, balanceDue: 100 });
    expect(summary.note.toLowerCase()).toContain(paymentStatus.toLowerCase());
  });

  it("does not assume cash has been collected when a COD order is delivered", () => {
    const summary = getReceiptPaymentSummary(order({
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      status: "DELIVERED",
    }));

    expect(summary).toMatchObject({ amountPaid: 0, netReceived: 0, balanceDue: 100 });
    expect(summary.note).toContain("Collection has not been recorded");
  });

  it("does not request an outstanding balance for an unpaid cancelled order", () => {
    expect(getReceiptPaymentSummary(order({ status: "CANCELLED", paymentStatus: "PENDING" })))
      .toMatchObject({ amountPaid: 0, netReceived: 0, balanceDue: 0 });
  });

  it("continues to report captured payment when a paid order is cancelled before its refund", () => {
    expect(getReceiptPaymentSummary(order({ status: "CANCELLED" })))
      .toMatchObject({ amountPaid: 100, refundedAmount: 0, netReceived: 100, balanceDue: 0 });
  });

  it("does not infer a payment refund from the order lifecycle alone", () => {
    expect(getReceiptPaymentSummary(order({ status: "REFUNDED", paymentStatus: "PAID" })))
      .toMatchObject({ amountPaid: 100, refundedAmount: 0, netReceived: 100, balanceDue: 0 });
  });

  it("subtracts the recorded partial refund in paise without reintroducing a balance due", () => {
    expect(getReceiptPaymentSummary(order({
      pricing: { subtotal: 100.01, shippingFee: 0, taxTotal: 0, grandTotal: 100.01 },
      paymentStatus: "PARTIALLY_REFUNDED",
      payment: { razorpayOrderId: "rzp-order-1", paidAt: "2026-10-06T00:01:00Z", refundedAmount: 30.02 },
    }))).toMatchObject({ amountPaid: 100.01, refundedAmount: 30.02, netReceived: 69.99, balanceDue: 0 });
  });

  it("leaves partial refund and net received unknown when the refund amount is missing", () => {
    const summary = getReceiptPaymentSummary(order({ paymentStatus: "PARTIALLY_REFUNDED" }));

    expect(summary).toMatchObject({ amountPaid: 100, refundedAmount: null, netReceived: null, balanceDue: 0 });
    expect(summary.note).toContain("refund amount is not recorded");
  });

  it.each([0, -1, 100, 101, Number.NaN, Number.POSITIVE_INFINITY])(
    "does not invent net received for an invalid partial refund of %s",
    (refundedAmount) => {
      expect(getReceiptPaymentSummary(order({
        paymentStatus: "PARTIALLY_REFUNDED",
        payment: { razorpayOrderId: null, paidAt: null, refundedAmount },
      }))).toMatchObject({ refundedAmount: null, netReceived: null, balanceDue: 0 });
    }
  );

  it("shows a full refund and zero net received even when optional payment detail is absent", () => {
    expect(getReceiptPaymentSummary(order({ paymentStatus: "REFUNDED", status: "CANCELLED" })))
      .toMatchObject({ amountPaid: 100, refundedAmount: 100, netReceived: 0, balanceDue: 0 });
  });
});

describe("receipt formatting", () => {
  it("prints INR amounts with two decimal places and Indian digit grouping", () => {
    expect(formatReceiptCurrency(0)).toBe("₹0.00");
    expect(formatReceiptCurrency(49.5)).toBe("₹49.50");
    expect(formatReceiptCurrency(123456.7)).toBe("₹1,23,456.70");
  });

  it("uses the India calendar date at midnight independently of the machine timezone", () => {
    expect(formatReceiptDate("2026-10-05T18:29:59.000Z")).toBe("05 Oct 2026");
    expect(formatReceiptDate("2026-10-05T18:30:00.000Z")).toBe("06 Oct 2026");
  });

  it("does not print an invalid date", () => {
    expect(formatReceiptDate("invalid-date")).toBe("—");
  });
});
