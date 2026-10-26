"use client";

import Link from "next/link";
import { useActiveOffers } from "@/lib/hooks/useActiveOffers";
import { findOfferMatchForProduct, offerConditions, offerTitle, offerUnitDiscount } from "@/lib/offers/matching";
import type { PublicOffer } from "@/lib/api/offer";

function names(offer: PublicOffer, ids: string[] | undefined): string {
  return (ids ?? []).map((id) => offer.productNames?.[id]?.name).filter(Boolean).join(", ");
}

// Product-page panel: the offer title, the admin's promotional text, what to
// buy and what is free, the real conditions, and how to claim it. Nothing
// renders when no live offer involves this product.
export default function ProductOfferInfo({
  productId,
  categoryId,
  sellingPrice,
}: {
  productId: string;
  categoryId?: string | null;
  sellingPrice?: number;
}) {
  const { data: offers } = useActiveOffers();
  const match = findOfferMatchForProduct(offers, { productId, categoryId }, sellingPrice);
  if (!match) return null;
  const { offer, role } = match;
  const roles = offer.mode === "BOGO_ROLES";
  const off = sellingPrice != null ? offerUnitDiscount(offer, sellingPrice) : 0;

  return (
    <aside aria-label="Special offer" className="mt-4 rounded-2xl border border-brand/25 bg-brand-soft p-4">
      <span className="inline-flex rounded-md bg-brand px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
        {offerTitle(offer)}
      </span>
      {offer.description && <p className="mt-2 break-words text-sm text-ink-muted">{offer.description}</p>}

      {roles && (
        <dl className="mt-2 space-y-1 text-sm">
          <div>
            <dt className="inline font-semibold text-ink">Buy: </dt>
            <dd className="inline text-ink-muted">{names(offer, offer.eligibleProductIds) || "selected products"}</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink">Get free: </dt>
            <dd className="inline text-ink-muted">{names(offer, offer.freeProductIds) || "selected products"}</dd>
          </div>
        </dl>
      )}
      {off > 0 && role === "BUY" && sellingPrice != null && (
        <p className="mt-2 text-sm font-semibold text-brand">
          Offer price: Rs. {(sellingPrice - off).toFixed(2)} each
          <span className="ml-1 font-normal text-ink-muted">(save Rs. {off.toFixed(2)})</span>
        </p>
      )}

      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-ink-muted">
        {offerConditions(offer).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {offer.type === "BOGO" && (
        <p className="mt-2 text-xs text-ink-muted">
          {roles
            ? role === "FREE"
              ? `Add ${offer.buyQuantity} qualifying item${offer.buyQuantity === 1 ? "" : "s"} and this one to your `
              : `Add ${offer.buyQuantity} of these and a free item to your `
            : `Add ${offer.buyQuantity + 1} eligible items to your `}
          <Link href="/cart" className="font-semibold text-brand underline">
            cart
          </Link>
          {roles ? "." : " and choose your free one there."}
        </p>
      )}
      {offer.type !== "BOGO" && (
        <p className="mt-2 text-xs text-ink-muted">
          The discount is applied automatically in your{" "}
          <Link href="/cart" className="font-semibold text-brand underline">
            cart
          </Link>
          .
        </p>
      )}
    </aside>
  );
}
