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
import { IconHeart } from "../ui/icons";
import ProductPackDetails from "./ProductPackDetails";
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

  const money = (n: number) => `Rs. ${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2)}`;
  const savings = product.pricing.mrp - product.pricing.sellingPrice;
  const actionBase = "absolute bottom-2 right-2 z-20 inline-flex h-9 w-[4.75rem] touch-manipulation items-center justify-center rounded-lg text-sm font-bold shadow-sm transition-colors";
  // Enlarges the ADD button's tap area. ONLY for that single button: on the +/− stepper
  // wrapper this invisible layer sits above its buttons and swallows every tap.
  const tapArea = "before:absolute before:-inset-1.5 before:content-['']";

  // Layout: large borderless image tile with the Add/stepper and wishlist
  // floating on it, then price pill + MRP, "Rs. X OFF", name, pack size.
  return (
    <div className="group relative flex h-full min-w-0 flex-col">
      <div className="relative shrink-0">
        <Link href={href} draggable={false} className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-cream">
          {outOfStock && (
            <span className="absolute left-2 top-2 z-10 rounded-md bg-charcoal/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Out of stock
            </span>
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
          className="absolute right-2 top-2 z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/95 text-ink-muted shadow-sm transition-colors hover:text-sale focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
        >
          <IconHeart className={`h-4 w-4 ${inWishlist ? "fill-sale text-sale" : ""}`} />
        </button>

        {quantity > 0 ? (
          <div className={`${actionBase} !w-24 overflow-hidden bg-brand text-white`} role="group" aria-label={`Quantity of ${product.name}`}>
            <button
              type="button"
              aria-label={`Remove one ${product.name}`}
              onClick={() => {
                if (cartLine) useCartStore.getState().decrementItem({ ...cartLine, quantity: 1 });
              }}
              className="h-9 min-w-0 flex-1 touch-manipulation text-xl active:bg-brand-darker"
            >−</button>
            <span aria-live="polite" aria-atomic="true" className="min-w-4 text-center text-sm font-bold">{quantity}</span>
            <button
              type="button"
              aria-label={`Add one more ${product.name}`}
              disabled={outOfStock || (product.inventory.trackInventory && quantity >= product.inventory.stockQuantity)}
              aria-busy={smartCart.busy}
              onClick={handleAddToCart}
              className={`h-9 min-w-0 flex-1 touch-manipulation text-xl active:bg-brand-darker disabled:opacity-50 ${smartCart.busy ? "bg-brand-darker" : ""}`}
            >+</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-busy={smartCart.busy}
            aria-label={`Add ${product.name} to cart`}
            className={`${actionBase} ${tapArea} border-2 disabled:cursor-not-allowed ${
              outOfStock
                ? "border-border bg-cream text-ink-faint opacity-60"
                : "border-brand bg-white text-brand active:bg-brand/10"
            }`}
          >
            {outOfStock ? "Sold out" : smartCart.busy ? "…" : "ADD"}
          </button>
        )}

        {/* Overlaid, not in flow: an error must not grow this card (and with it
            its whole grid row) or shift the page under the user's finger. */}
        {smartCart.error && (
          <p
            role="alert"
            className="absolute inset-x-2 bottom-12 z-30 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold leading-4 text-red-700 shadow-sm"
          >
            {smartCart.error}
          </p>
        )}
      </div>

      <div className="mt-2 flex-1 px-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="rounded-md bg-brand px-2 py-0.5 font-display text-sm font-extrabold leading-5 text-white">
            {money(product.pricing.sellingPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-ink-faint line-through">{money(product.pricing.mrp)}</span>
          )}
        </div>
        {hasDiscount && (
          <p className="mt-1 text-xs font-bold uppercase leading-4 text-brand">{money(savings)} OFF</p>
        )}
        {!outOfStock && (
          <ProductOfferBadge
            productId={product.productId}
            categoryId={product.category?.categoryId}
            price={product.pricing.sellingPrice}
            variant="tag"
            className="mt-1"
          />
        )}
        {!outOfStock && (
          <ProductOfferPrice
            productId={product.productId}
            categoryId={product.category?.categoryId}
            sellingPrice={product.pricing.sellingPrice}
            className="mt-0.5"
          />
        )}
        <Link href={href} draggable={false}>
          <h3 className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-snug text-ink hover:text-brand">
            {product.name}
          </h3>
        </Link>
        <ProductPackDetails weightPerPackGrams={product.weightPerPackGrams} numberOfPacks={product.numberOfPacks} />
        <ProductAvailability inventory={product.inventory} size="sm" className="mt-1 leading-4" />
      </div>
      {smartCart.modal}
    </div>
  );
}

// Cards sit in large lists; memo keeps a parent re-render (filters, pagination,
// the cart badge) from re-rendering every card whose product didn't change.
export default memo(ProductCard);
