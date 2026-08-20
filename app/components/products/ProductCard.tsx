"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/api/client";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useToggleWishlist } from "@/lib/hooks/useToggleWishlist";
import { useAuthGate } from "@/lib/auth/useAuthGate";
import { useCartStore } from "@/lib/store/cart.store";
import { IconHeart, IconCart } from "../ui/icons";
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
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);

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
    addItem({
      productId: product.productId,
      slug: product.slug,
      name: product.name,
      image: imageUrl ? resolveMediaUrl(imageUrl) : null,
      imageAlt: product.image?.altText || product.name,
      price: product.pricing.sellingPrice,
      mrp: product.pricing.mrp,
      quantity: 1,
      maxQuantity: product.inventory.trackInventory ? product.inventory.stockQuantity : undefined,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(28,28,28,0.25)]">
      <Link href={href} className="relative block aspect-square w-full overflow-hidden bg-cream">
        {outOfStock ? (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-charcoal/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Out of stock
          </span>
        ) : (
          hasDiscount && (
            <span className="absolute left-3 top-3 z-10 rounded-md bg-sale px-2 py-1 text-xs font-bold text-white">
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
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-muted shadow-sm transition-colors hover:text-sale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
      >
        <IconHeart className={`h-4 w-4 ${inWishlist ? "fill-sale text-sale" : ""}`} />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            {product.brand.name}
          </span>
        )}
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[2.5em] break-words font-display text-sm font-semibold leading-snug text-ink hover:text-brand sm:text-base">
            {product.name}
          </h3>
        </Link>
        <ProductPrice pricing={product.pricing} size="sm" />
        <ProductAvailability inventory={product.inventory} size="sm" />

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-brand text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:text-xs"
        >
          <IconCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {outOfStock ? "Out of Stock" : justAdded ? "Added" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
