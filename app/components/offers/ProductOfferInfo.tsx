"use client";

import Link from "next/link";
import { useActiveOffers } from "@/lib/hooks/useActiveOffers";
import { findOfferForProduct, offerBadgeLabel, offerConditions } from "@/lib/offers/matching";

// Product-page panel: the badge, the admin's promotional text, the real
// conditions, and how to claim it. Nothing renders when no live offer covers
// this product.
export default function ProductOfferInfo({
  productId,
  categoryId,
}: {
  productId: string;
  categoryId?: string | null;
}) {
  const { data: offers } = useActiveOffers();
  const offer = findOfferForProduct(offers, { productId, categoryId });
  if (!offer) return null;

  return (
    <aside
      aria-label="Special offer"
      className="mt-4 rounded-2xl border border-brand/25 bg-brand-soft p-4"
    >
      <span className="inline-flex rounded-md bg-brand px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
        {offerBadgeLabel(offer)}
      </span>
      <p className="mt-2 text-sm font-semibold text-ink">{offer.name}</p>
      {offer.description && <p className="mt-0.5 text-sm text-ink-muted">{offer.description}</p>}
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-ink-muted">
        {offerConditions(offer).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">
        Add {offer.buyQuantity + 1} eligible items to your{" "}
        <Link href="/cart" className="font-semibold text-brand underline">
          cart
        </Link>{" "}
        and choose your free one there.
      </p>
    </aside>
  );
}
