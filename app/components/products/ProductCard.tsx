"use client";

import { memo } from "react";
import { useSmartCart } from "@/lib/hooks/useSmartCart";
import { useCartStore } from "@/lib/store/cart.store";
import { cartLineKey } from "../cart/cart-data";
import Link from "next/link";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/api/client";
import { useShowMrp } from "@/lib/hooks/useShowMrp";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useToggleWishlist } from "@/lib/hooks/useToggleWishlist";
import { useAuthGate } from "@/lib/auth/useAuthGate";
import { IconHeart, IconCart } from "../ui/icons";
import ProductPrice from "./ProductPrice";
import ProductPackDetails from "./ProductPackDetails";
import styles from "./ProductCard.module.css";
import ProductAvailability from "./ProductAvailability";
import ProductOfferBadge from "../offers/ProductOfferBadge";
import ProductOfferPrice from "../offers/ProductOfferPrice";
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
function ProductCard({
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
  const cartLine = useCartStore((state) => state.items.find(
    (item) => cartLineKey(item) === `${product.productId}:UNIT`
  ));
  const quantity = cartLine?.quantity ?? 0;

  const inWishlist = Boolean(wishlist?.items.some((i) => i.productId === product.productId));
  const href = `/products/${product.slug}`;
  const imageUrl = product.image?.mediumUrl ?? product.image?.thumbnailUrl ?? product.image?.url;
  const outOfStock = !product.inventory.inStock;
  const showMrp = useShowMrp(product.pricing.mrpDisplay);
  const hasDiscount = showMrp && product.pricing.discountPercentage > 0 && product.pricing.mrp > product.pricing.sellingPrice;

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
    // First "Add" ignores a second press while its check is running (a
    // double-click must not add two). Once in the cart, "+" presses made
    // during a check are remembered and added right after, so quick taps all
    // count instead of needing one tap per server round-trip.
    if (quantity === 0 && smartCart.busy) return;
    void smartCart.add(1, { queueIfBusy: quantity > 0 });
  }

  return (
    <div className={`${styles.card} group relative flex h-full min-w-0 flex-col rounded-2xl border border-border bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_20px_40px_-24px_rgba(28,28,28,0.25)] sm:p-3.5`}>
      <div className="relative shrink-0">
        <Link href={href} draggable={false} className="relative block aspect-square w-full overflow-hidden rounded-xl bg-cream">
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

          {!outOfStock && (
            <ProductOfferBadge
              productId={product.productId}
              categoryId={product.category?.categoryId}
              price={product.pricing.sellingPrice}
              className="absolute bottom-2 left-2 z-10"
            />
          )}

          {imageUrl ? (
            <Image
              src={resolveMediaUrl(imageUrl)}
              alt={product.image?.altText ?? product.name}
              fill
              draggable={false}
              loading={priority ? undefined : "lazy"}
              priority={priority}
              sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 46vw"
              className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-105"
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
          className="absolute right-2 top-2 z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-ink-muted shadow-sm transition-colors hover:text-sale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
        >
          <IconHeart className={`h-5 w-5 ${inWishlist ? "fill-sale text-sale" : ""}`} />
        </button>
      </div>

      <div className="mt-2 flex-1">
        <span className="block h-4 truncate text-[11px] font-semibold uppercase leading-4 tracking-wide text-ink-faint">
          {product.brand?.name ?? ""}
        </span>
        <Link href={href} draggable={false}>
          <h3 className="line-clamp-2 min-h-[2.75em] break-words font-display text-sm font-bold leading-snug text-ink hover:text-brand sm:text-base">
            {product.name}
          </h3>
        </Link>
        <ProductPackDetails weightPerPackGrams={product.weightPerPackGrams} numberOfPacks={product.numberOfPacks} />
      </div>

      <div className={styles.footer}>
        <div className="min-w-0 space-y-1">
          <ProductAvailability inventory={product.inventory} size="sm" className="leading-4" />
          <ProductPrice pricing={product.pricing} size="sm" showDiscountBadge={false} className={styles.price} />
          {!outOfStock && (
            <ProductOfferPrice
              productId={product.productId}
              categoryId={product.category?.categoryId}
              sellingPrice={product.pricing.sellingPrice}
            />
          )}
        </div>

        <div className={styles.controls}>

        {quantity > 0 ? (
          <div className="inline-flex h-11 w-full min-w-0 items-center overflow-hidden rounded-full bg-brand text-white" role="group" aria-label={`Quantity of ${product.name}`}>
            <button
              type="button"
              aria-label={`Remove one ${product.name}`}
              onClick={() => {
                if (cartLine) useCartStore.getState().decrementItem({ ...cartLine, quantity: 1 });
              }}
              className="h-11 min-w-0 flex-1 touch-manipulation text-xl transition-colors active:bg-brand-darker"
            >−</button>
            <span aria-live="polite" aria-atomic="true" className="min-w-5 text-center text-sm font-bold">{quantity}</span>
            <button
              type="button"
              aria-label={`Add one more ${product.name}`}
              disabled={outOfStock || (product.inventory.trackInventory && quantity >= product.inventory.stockQuantity)}
              aria-busy={smartCart.busy}
              onClick={handleAddToCart}
              className={`h-11 min-w-0 flex-1 touch-manipulation text-xl transition-colors active:bg-brand-darker disabled:opacity-50 ${smartCart.busy ? "bg-brand-darker" : ""}`}
            >+</button>
          </div>
        ) : <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          aria-busy={smartCart.busy}
          // The ::before is an invisible 8px ring around the green pill that belongs
          // to the button, so a tap on its edge or just outside it still adds.
          className={`relative inline-flex h-11 w-full min-w-0 touch-manipulation items-center justify-center gap-1 rounded-full px-2 text-sm font-bold transition-colors before:absolute before:-inset-2 before:content-[''] disabled:cursor-not-allowed ${
            smartCart.busy
              ? "bg-brand-darker text-white"
              : outOfStock
                ? "bg-cream text-ink-faint opacity-50"
                : "bg-brand text-white active:bg-brand-darker"
          }`}
        >
          {outOfStock ? (
            "Sold Out"
          ) : smartCart.busy ? (
            "Adding…"
          ) : (
            <>
              <IconCart className="h-3.5 w-3.5" /> Add
            </>
          )}
        </button>}

        </div>
      </div>
      {/* Overlaid, not in flow: an error must not grow this card (and with it
          its whole grid row) or shift the page under the user's finger. */}
      {smartCart.error && (
        <p
          role="alert"
          className="absolute inset-x-3 bottom-[4.5rem] z-30 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold leading-4 text-red-700 shadow-sm"
        >
          {smartCart.error}
        </p>
      )}
      {smartCart.modal}
    </div>
  );
}

// Cards sit in large lists; memo keeps a parent re-render (filters, pagination,
// the cart badge) from re-rendering every card whose product didn't change.
export default memo(ProductCard);
