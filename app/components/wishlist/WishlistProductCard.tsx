import ProductArt from "../sections/ProductArt";
import { IconCart, IconHeart } from "../ui/icons";
import type { WishlistProduct } from "./wishlist-data";

export default function WishlistProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
}: {
  product: WishlistProduct;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}) {
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(28,28,28,0.25)]">
      <div className="relative aspect-square overflow-hidden bg-cream">
        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-sale px-2 py-1 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          onClick={onToggleWishlist}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-colors ${
            isWishlisted ? "bg-brand text-white" : "bg-white text-ink-muted hover:text-brand"
          }`}
        >
          <IconHeart className="h-4 w-4" fill={isWishlisted ? "currentColor" : "none"} />
        </button>
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <ProductArt accent={product.accent} count={product.count} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-[15px] font-semibold leading-snug text-ink sm:text-base">
          {product.name}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">Rs. {product.price.toFixed(2)}</span>
          <span className="text-sm text-ink-faint line-through">
            Rs. {product.originalPrice.toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark"
        >
          <IconCart className="h-4 w-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
