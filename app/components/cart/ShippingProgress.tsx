import {
  CASHBACK_PERCENT,
  CASHBACK_THRESHOLD,
  FREE_SHIPPING_THRESHOLD,
} from "./cart-data";

export default function ShippingProgress({ subtotal }: { subtotal: number }) {
  const reachedFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const reachedCashback = subtotal >= CASHBACK_THRESHOLD;
  const progress = Math.min((subtotal / CASHBACK_THRESHOLD) * 100, 100);
  const freeShippingMark = (FREE_SHIPPING_THRESHOLD / CASHBACK_THRESHOLD) * 100;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <p className="text-center text-sm leading-relaxed text-ink sm:text-base">
        {reachedCashback ? (
          <>
            You&apos;ve unlocked <span className="font-bold text-brand">FREE SHIPPING</span>{" "}
            and{" "}
            <span className="font-bold text-terracotta">
              {CASHBACK_PERCENT}% EXTRA CASHBACK
            </span>
            !
          </>
        ) : reachedFreeShipping ? (
          <>
            Great! You&apos;ve unlocked{" "}
            <span className="font-bold text-brand">FREE SHIPPING</span>. Only{" "}
            <span className="font-bold text-terracotta">
              Rs. {(CASHBACK_THRESHOLD - subtotal).toFixed(2)}
            </span>{" "}
            away from{" "}
            <span className="font-bold text-terracotta">
              {CASHBACK_PERCENT}% EXTRA CASHBACK
            </span>
          </>
        ) : (
          <>
            Add{" "}
            <span className="font-bold text-brand">
              Rs. {(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)}
            </span>{" "}
            more to unlock <span className="font-bold text-brand">FREE SHIPPING</span>
          </>
        )}
      </p>

      <div className="mt-5 flex items-center gap-3">
        <span className="shrink-0 text-xs font-semibold text-ink-faint">Rs. 0</span>
        <div className="relative flex-1">
          <div className="h-2 w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand shadow"
            style={{ left: `${freeShippingMark}%` }}
            aria-hidden
          />
          <div className="relative mt-2 h-4">
            <span
              className="absolute -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-brand sm:text-[11px]"
              style={{ left: `${freeShippingMark}%` }}
            >
              Free Shipping
            </span>
            <span className="absolute right-0 text-[10px] font-bold uppercase tracking-wider text-terracotta sm:text-[11px]">
              {CASHBACK_PERCENT}% Cashback
            </span>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-ink-faint">
          Rs. {CASHBACK_THRESHOLD}
        </span>
      </div>
    </div>
  );
}
