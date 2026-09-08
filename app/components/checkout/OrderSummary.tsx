"use client";

import Image from "next/image";
import { resolveMediaUrl } from "@/lib/api/client";
import type { CheckoutPreviewResult } from "@/lib/api/checkout";

// Every number rendered here comes from the server's /checkout/preview
// response, never from the client-side cart's price snapshot — the cart's
// prices are display-only and may be stale (see cart-data.ts).
export default function OrderSummary({
  preview,
  isLoading,
}: {
  preview: CheckoutPreviewResult | null;
  isLoading: boolean;
}) {
  if (isLoading || !preview) {
    return (
      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">Order summary</h2>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-cream" />
          ))}
        </div>
      </section>
    );
  }

  const { items, pricing, coupon } = preview;
  const showCouponLine = Boolean(coupon && (pricing.discountTotal > 0 || coupon.freeDelivery));

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-ink">Order summary</h2>

      <ul className="mt-4 divide-y divide-border">
        {items.map((item) => {
          const hasProblem = item.unavailable || item.insufficientStock;
          return (
            <li key={item.productId} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                {item.imageUrl ? (
                  <Image
                    src={resolveMediaUrl(item.imageUrl)}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-ink-faint">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-ink">{item.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Qty {item.quantity} × Rs. {item.unitPrice.toFixed(2)}
                  {item.discountPercentage > 0 && (
                    <span className="ml-1.5 text-ink-faint line-through">Rs. {item.mrp.toFixed(2)}</span>
                  )}
                </p>

                {hasProblem && (
                  <p className="mt-1.5 inline-flex rounded-full bg-sale/10 px-2 py-0.5 text-[11px] font-bold text-sale">
                    {item.unavailable
                      ? "No longer available"
                      : typeof item.availableQuantity === "number"
                        ? `Only ${item.availableQuantity} left in stock`
                        : "Not enough stock"}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right text-sm font-bold text-ink">
                Rs. {item.lineTotal.toFixed(2)}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-ink-muted">
          <span>Subtotal</span>
          <span className="font-semibold text-ink">Rs. {pricing.subtotal.toFixed(2)}</span>
        </div>
        {showCouponLine && coupon && (
          <div className="flex justify-between text-brand">
            <span>Coupon ({coupon.code})</span>
            <span className="font-semibold">
              {coupon.freeDelivery && pricing.discountTotal === 0
                ? "Free delivery"
                : `− Rs. ${pricing.discountTotal.toFixed(2)}`}
            </span>
          </div>
        )}
        <div className="flex justify-between text-ink-muted">
          <span>Shipping</span>
          <span className={`font-semibold ${pricing.shippingFee === 0 ? "text-brand" : "text-ink"}`}>
            {pricing.shippingFee === 0 ? "Free" : `Rs. ${pricing.shippingFee.toFixed(2)}`}
          </span>
        </div>
        {pricing.taxTotal > 0 && (
          <div className="flex justify-between text-ink-muted">
            <span>Tax</span>
            <span className="font-semibold text-ink">Rs. {pricing.taxTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-base font-bold text-ink">Total</span>
        <span className="text-xl font-extrabold text-brand">Rs. {pricing.grandTotal.toFixed(2)}</span>
      </div>
    </section>
  );
}
