"use client";

import { useActiveOffers } from "@/lib/hooks/useActiveOffers";
import { findOfferMatchForProduct, offerUnitDiscount } from "@/lib/offers/matching";

// "With offer: Rs. X" for percentage / fixed-amount offers. The amount is
// worked out exactly like the cart does it (per-unit paise, capped at the
// price), so what a card promises is what the cart takes off. Nothing renders
// for Buy X Get Y Free offers (there is no per-unit price cut) or when no live
// offer applies to the product.
export default function ProductOfferPrice({
  productId,
  categoryId,
  sellingPrice,
  className = "",
}: {
  productId: string;
  categoryId?: string | null;
  sellingPrice: number;
  className?: string;
}) {
  const { data: offers } = useActiveOffers();
  const match = findOfferMatchForProduct(offers, { productId, categoryId }, sellingPrice);
  if (!match || match.role !== "BUY") return null;
  const off = offerUnitDiscount(match.offer, sellingPrice);
  if (off <= 0) return null;

  return (
    <p
      title={`Offer price — you save Rs. ${off.toFixed(2)} on each unit`}
      className={`whitespace-nowrap text-xs font-semibold text-brand ${className}`}
    >
      Offer: Rs. {(sellingPrice - off).toFixed(2)}
    </p>
  );
}
