import type { PublicProductPricing } from "@/lib/api/publicProducts";

// Every number here (mrp, sellingPrice, discountPercentage) comes straight
// from the backend's computeDiscount() — this component only formats and
// arranges them, it never computes a discount or price itself (spec: price/
// discount math is backend-authoritative only).
export default function ProductPrice({
  pricing,
  size = "md",
}: {
  pricing: PublicProductPricing;
  size?: "sm" | "md" | "lg";
}) {
  const hasDiscount = pricing.discountPercentage > 0 && pricing.mrp > pricing.sellingPrice;

  const priceClass = size === "lg" ? "text-2xl sm:text-3xl" : size === "sm" ? "text-sm" : "text-lg";
  const mrpClass = size === "lg" ? "text-base" : "text-xs";

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-display font-extrabold text-brand ${priceClass}`}>
        Rs. {pricing.sellingPrice.toFixed(2)}
      </span>
      {hasDiscount && (
        <>
          <span className={`text-ink-faint line-through ${mrpClass}`}>Rs. {pricing.mrp.toFixed(2)}</span>
          <span className="rounded-full bg-sale/10 px-2 py-0.5 text-[11px] font-bold text-sale">
            {Math.round(pricing.discountPercentage)}% OFF
          </span>
        </>
      )}
    </div>
  );
}
