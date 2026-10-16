import { useShippingPolicy } from "@/lib/hooks/useShippingPolicy";

export default function ShippingProgress({ subtotal }: { subtotal: number }) {
  const { freeShippingThreshold } = useShippingPolicy();
  const reachedFreeShipping = subtotal >= freeShippingThreshold;
  const progress = freeShippingThreshold > 0 ? Math.min((subtotal / freeShippingThreshold) * 100, 100) : 100;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <p className="text-center text-sm leading-relaxed text-ink sm:text-base">
        {reachedFreeShipping ? (
          <>
            You&apos;ve unlocked <span className="font-bold text-brand">FREE SHIPPING</span>!
          </>
        ) : (
          <>
            Add{" "}
            <span className="font-bold text-brand">
              Rs. {(freeShippingThreshold - subtotal).toFixed(2)}
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
          <div className="mt-2 flex items-center justify-end text-[10px] font-bold uppercase tracking-wider sm:text-[11px]">
            <span className="text-brand">Free Shipping</span>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-ink-faint">
          Rs. {freeShippingThreshold}
        </span>
      </div>
    </div>
  );
}
