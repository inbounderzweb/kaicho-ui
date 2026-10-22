"use client";

import { useActiveOffers } from "@/lib/hooks/useActiveOffers";
import { findOfferForProduct, offerBadgeLabel } from "@/lib/offers/matching";

// "Buy 1 Get 1 Free" pill for a product card. Renders nothing when no live
// offer covers the product (and while offers are still loading), so cards
// never reserve space or shift. Display-only — see lib/offers/matching.ts.
export default function ProductOfferBadge({
  productId,
  categoryId,
  className = "",
}: {
  productId: string;
  categoryId?: string | null;
  className?: string;
}) {
  const { data: offers } = useActiveOffers();
  const offer = findOfferForProduct(offers, { productId, categoryId });
  if (!offer) return null;

  return (
    <span
      title={offer.description ?? offerBadgeLabel(offer)}
      className={`pointer-events-none inline-flex max-w-full items-center truncate rounded-md bg-brand px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-wide text-white shadow-sm sm:text-[11px] ${className}`}
    >
      {offerBadgeLabel(offer)}
    </span>
  );
}
