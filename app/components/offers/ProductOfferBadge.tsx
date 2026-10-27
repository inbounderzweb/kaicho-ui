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
  variant = "pill",
}: {
  productId: string;
  categoryId?: string | null;
  /** The product's selling price, used to pick the most generous offer when several apply. */
  price?: number;
  className?: string;
  /** "pill" = solid badge for overlaying images; "tag" = light inline tag for under the price. */
  variant?: "pill" | "tag";
}) {
  const { data: offers } = useActiveOffers();
  const match = findOfferMatchForProduct(offers, { productId, categoryId }, price);
  if (!match) return null;
  const { offer, role } = match;
  const title = offerTitle(offer);

  return (
    <span
      title={offer.description ?? (role === "FREE" ? `${title} — free with a qualifying purchase` : title)}
      className={`pointer-events-none line-clamp-2 w-fit break-words rounded-md ${variant === "tag" ? "bg-brand/10 px-1.5 py-0.5 text-[11px] text-brand" : "bg-brand px-2 py-1 text-[10px] text-white shadow-sm sm:text-[11px]"} font-bold uppercase leading-tight tracking-wide ${className}`}
    >
      {title}
    </span>
  );
}
