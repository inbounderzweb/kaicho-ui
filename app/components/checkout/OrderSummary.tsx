"use client";

import Image from "next/image";
import { resolveMediaUrl } from "@/lib/api/client";
import { useShowMrp } from "@/lib/hooks/useShowMrp";
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
  const showMrp = useShowMrp();
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

  const { items, pricing, coupon, offer } = preview;
  const offerDiscountTotal = pricing.offerDiscountTotal ?? 0;
  const showCouponLine = Boolean(coupon && (pricing.discountTotal > 0 || coupon.freeDelivery));

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-ink">Order summary</h2>

      <ul className="mt-4 divide-y divide-border">
        {items.map((item) => {
          const hasProblem = item.unavailable || item.insufficientStock;
          return (
            <li key={item.productId} className="flex gap-2.5 py-4 first:pt-0 last:pb-0 sm:gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-16 sm:w-16">
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
                <p className="line-clamp-2 break-words text-sm font-semibold text-ink">{item.name}</p>
                {item.selectionType === "PACK" && item.packBreakdown?.length ? (
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {item.packBreakdown.map((l) => `${l.packName} × ${l.packCount}`).join(" + ")}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Qty {item.quantity} × Rs. {item.unitPrice.toFixed(2)}
                    {showMrp && item.discountPercentage > 0 && (
                      <span className="ml-1.5 text-ink-faint line-through">Rs. {item.mrp.toFixed(2)}</span>
                    )}
                  </p>
                )}

                {(item.freeQuantity ?? 0) > 0 && (
                  <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-semibold leading-snug text-brand">
                    <span className="rounded bg-brand px-1 text-[10px] uppercase tracking-wide text-white">Free</span>
                    <span className="min-w-0 break-words">
                      {item.freeQuantity} free item{item.freeQuantity === 1 ? "" : "s"} · you save Rs. {(item.offerDiscount ?? 0).toFixed(2)}
                    </span>
                  </p>
                )}

                {hasProblem && (
                  <p className="mt-1.5 inline-flex rounded-full bg-sale/10 px-2 py-0.5 text-[11px] font-bold text-sale">
                    {item.packError
                      ? item.packError
                      : item.unavailable
                        ? "No longer available"
                        : typeof item.availableQuantity === "number"
                          ? `Only ${item.availableQuantity} left in stock`
                          : "Not enough stock"}
                  </p>
                )}
              </div>

              <div className="shrink-0 whitespace-nowrap text-right text-sm font-bold text-ink">
                {(item.offerDiscount ?? 0) > 0 ? (
                  <>
                    <span className="block text-[11px] font-medium text-ink-faint line-through">
                      Rs. {item.lineTotal.toFixed(2)}
                    </span>
                    Rs. {(item.lineTotal - (item.offerDiscount ?? 0)).toFixed(2)}
                  </>
                ) : (
                  <>Rs. {item.lineTotal.toFixed(2)}</>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
        <div className="flex items-start justify-between gap-3 text-ink-muted">
          <span>Subtotal</span>
          <span className="shrink-0 whitespace-nowrap font-semibold text-ink">Rs. {pricing.subtotal.toFixed(2)}</span>
        </div>
        {offerDiscountTotal > 0 && (
          <div className="flex items-start justify-between gap-3 text-brand">
            <span className="min-w-0">Free item discount{offer && offer.freeUnits > 1 ? ` (${offer.freeUnits} items)` : ""}</span>
            <span className="shrink-0 whitespace-nowrap font-semibold">− Rs. {offerDiscountTotal.toFixed(2)}</span>
          </div>
        )}
        {showCouponLine && coupon && (
          <div className="flex items-start justify-between gap-3 text-brand">
            <span>Coupon ({coupon.code})</span>
            <span className="shrink-0 whitespace-nowrap font-semibold">
              {coupon.freeDelivery && pricing.discountTotal === 0
                ? "Free delivery"
                : `− Rs. ${pricing.discountTotal.toFixed(2)}`}
            </span>
          </div>
        )}
        <div className="flex items-start justify-between gap-3 text-ink-muted">
          <span>Shipping</span>
          <span className={`shrink-0 whitespace-nowrap font-semibold ${pricing.shippingFee === 0 ? "text-brand" : "text-ink"}`}>
            {pricing.shippingFee === 0 ? "Free" : `Rs. ${pricing.shippingFee.toFixed(2)}`}
          </span>
        </div>
        {pricing.taxTotal > 0 && (
          <div className="flex items-start justify-between gap-3 text-ink-muted">
            <span>Tax</span>
            <span className="shrink-0 whitespace-nowrap font-semibold text-ink">Rs. {pricing.taxTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      {offer && offer.rejected.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1">
          {offer.rejected.map((r, i) => (
            <li key={`${r.productId}-${i}`} className="rounded-lg bg-sale/10 px-3 py-2 text-xs font-semibold text-sale">
              {items.find((it) => it.productId === r.productId)?.name ?? "An item"}: {r.message}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-base font-bold text-ink">Total</span>
        <span className="text-xl font-extrabold text-brand">Rs. {pricing.grandTotal.toFixed(2)}</span>
      </div>
    </section>
  );
}
