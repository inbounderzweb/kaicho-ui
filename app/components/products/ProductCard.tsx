"use client";

import { useSmartCart } from "@/lib/hooks/useSmartCart";
import Link from "next/link";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/api/client";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useToggleWishlist } from "@/lib/hooks/useToggleWishlist";
import { useAuthGate } from "@/lib/auth/useAuthGate";
import { IconHeart, IconCart, IconCheck } from "../ui/icons";
import ProductPrice from "./ProductPrice";
import ProductAvailability from "./ProductAvailability";
import type { PublicProductListItem } from "@/lib/api/publicProducts";

// The ONE reusable product card — every place a product summary is
// rendered (ProductGrid on /products and /category/:slug, RelatedProducts,
// and the wishlist page) renders this same component, so the card looks
// and behaves identically everywhere instead of drifting into
// near-duplicate implementations. Page-specific behavior (e.g. the
// wishlist page always showing a filled heart) falls naturally out of
// real wishlist/cart state rather than a second component.
//
// Image uses the medium variant. The thumbnail variant (300px source) was
// tried first per "use the right Media variant per context", but at this
// card's actual rendered width (roughly 200-320px CSS, so 400-640px on a
// 2x/retina screen) a 300px source can't fill the box without upscaling —
// which is what "not clear"/blurry reports were from. Medium (800px
// source) comfortably covers retina at this card size without being
// oversized like the full "optimized" variant would be. Falls back to
// thumbnail/optimized for any older media doc that predates variants.
// Lazy-loaded by default; only the above-the-fold first row passes
// `priority`.
export default function ProductCard({
  product,
  priority = false,
}: {
  product: PublicProductListItem;
  priority?: boolean;
}) {
  const { data: wishlist } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const { guard } = useAuthGate();
  const smartCart = useSmartCart(product.productId);
  const justAdded = smartCart.added;

  const inWishlist = Boolean(wishlist?.items.some((i) => i.productId === product.productId));
  const href = `/products/${product.slug}`;
  const imageUrl = product.image?.mediumUrl ?? product.image?.thumbnailUrl ?? product.image?.url;
  const outOfStock = !product.inventory.inStock;
  const hasDiscount = product.pricing.discountPercentage > 0 && product.pricing.mrp > product.pricing.sellingPrice;

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    guard(() => {
      toggleWishlist.mutate({ productId: product.productId, inWishlist });
    });
  }

  // Quick-add from the card: quantity is always 1, and — same as the
  // detail page's Add to Cart — this only ever sends the productId/quantity
  // plus a display snapshot of the backend-computed price at add time. The
  // backend remains authoritative for price/stock at checkout; nothing here
  // recomputes either.
  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    void smartCart.add(1);
  }

  return (
    <div className="group relative flex h-full min-w-0 flex-col rounded-2xl border border-border bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_20px_40px_-24px_rgba(28,28,28,0.25)] sm:p-3.5">
      <div className="relative shrink-0">
        <Link href={href} className="relative block aspect-square w-full overflow-hidden rounded-xl bg-cream">
          {outOfStock ? (
            <span className="absolute left-2 top-2 z-10 rounded-md bg-charcoal/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Out of stock
            </span>
          ) : (
            hasDiscount && (
              <span className="absolute left-2 top-2 z-10 rounded-md bg-sale px-2 py-1 text-xs font-bold text-white">
                -{Math.round(product.pricing.discountPercentage)}%
              </span>
            )
          )}

          {imageUrl ? (
            <Image
              src={resolveMediaUrl(imageUrl)}
              alt={product.image?.altText ?? product.name}
              fill
              loading={priority ? undefined : "lazy"}
              priority={priority}
              sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 46vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-ink-faint">
              No image
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={inWishlist}
          disabled={toggleWishlist.isPending}
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-muted shadow-sm transition-colors hover:text-sale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
        >
          <IconHeart className={`h-3.5 w-3.5 ${inWishlist ? "fill-sale text-sale" : ""}`} />
        </button>
      </div>

      <div className="mt-3 flex-1">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            {product.brand.name}
          </span>
        )}
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[2.75em] break-words font-display text-sm font-bold leading-snug text-ink hover:text-brand sm:text-base">
            {product.name}
          </h3>
        </Link>
        <ProductAvailability inventory={product.inventory} size="sm" className="mt-0.5" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <ProductPrice pricing={product.pricing} size="sm" />

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock || smartCart.busy}
          className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            justAdded
              ? "bg-brand-darker text-white"
              : outOfStock
                ? "bg-cream text-ink-faint"
                : "bg-brand-soft text-brand-dark hover:bg-brand hover:text-white"
          }`}
        >
          {outOfStock ? (
            "Sold Out"
          ) : smartCart.busy ? (
            "…"
          ) : justAdded ? (
            <>
              <IconCheck className="h-3.5 w-3.5" strokeWidth={2.4} /> Added
            </>
          ) : (
            <>
              <IconCart className="h-3.5 w-3.5" /> Add
            </>
          )}
        </button>
      </div>
      {smartCart.error && (
        <p role="alert" className="mt-1.5 text-xs text-red-700">
          {smartCart.error}
        </p>
      )}
      {smartCart.modal}
    </div>
  );
}
