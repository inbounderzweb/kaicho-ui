import { useShippingPolicy } from "@/lib/hooks/useShippingPolicy";

// Compact: small muted text plus the animated progress bar, no card/highlight.
export default function ShippingProgress({ subtotal }: { subtotal: number }) {
  const { freeShippingThreshold } = useShippingPolicy();
  if (freeShippingThreshold <= 0) return null;

  const reachedFreeShipping = subtotal >= freeShippingThreshold;
  const progress = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  return (
    <div className="px-1">
      <p className="text-xs text-ink-muted">
        {reachedFreeShipping
          ? "You've unlocked free shipping."
          : `Add Rs. ${(freeShippingThreshold - subtotal).toFixed(2)} more to unlock free shipping.`}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="shrink-0 text-[10px] text-ink-faint">Rs. 0</span>
        <div className="h-1.5 flex-1 rounded-full bg-border">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-[10px] text-ink-faint">Rs. {freeShippingThreshold}</span>
      </div>
    </div>
  );
}
