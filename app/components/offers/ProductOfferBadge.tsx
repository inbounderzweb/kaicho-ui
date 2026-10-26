"use client";

import { useActiveOffers } from "@/lib/hooks/useActiveOffers";
import { findOfferMatchForProduct, offerTitle } from "@/lib/offers/matching";

// Offer pill for a product card — the admin's own offer title ("Buy 1 Get 1
// Free", "50% Off", "Flat ₹100 Off"…). Renders nothing when no live offer
// involves the product (and while offers are still loading), so cards never
// reserve space, shift, or show a default offer that doesn't apply.
// Display-only — see lib/offers/matching.ts.
export default function ProductOfferBadge({
  productId,
  categoryId,
  price,
  className = "",
}: {
  productId: string;
  categoryId?: string | null;
  /** The product's selling price, used to pick the most generous offer when several apply. */
  price?: number;
  className?: string;
}) {
  const { data: offers } = useActiveOffers();
  const match = findOfferMatchForProduct(offers, { productId, categoryId }, price);
  if (!match) return null;
  const { offer, role } = match;
  const title = offerTitle(offer);

  return (
    <span
      title={offer.description ?? (role === "FREE" ? `${title} — free with a qualifying purchase` : title)}
      className={`pointer-events-none inline-flex max-w-full items-center truncate rounded-md bg-brand px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-wide text-white shadow-sm sm:text-[11px] ${className}`}
    >
      {title}
    </span>
  );
}
