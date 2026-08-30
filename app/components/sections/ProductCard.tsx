"use client";

import Link from "next/link";
import { useState } from "react";
import { IconCart, IconCheck, IconHeart } from "../ui/icons";
import ProductArt from "./ProductArt";
import { slugify, type Product } from "./product-data";
import { useCartStore } from "@/lib/store/cart.store";
import { resolveMediaUrl } from "@/lib/api/client";

export default function ProductCard({
  name,
  price,
  originalPrice,
  accent,
  count,
  tags,
  image,
  compact = false,
}: Product & { compact?: boolean }) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const discount = Math.round((1 - price / originalPrice) * 100);
  const href = `/products/${slugify(name)}`;
  const imageUrl = image ? resolveMediaUrl(image) : null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: slugify(name),
      slug: slugify(name),
      name,
      image: imageUrl,
      imageAlt: name,
      price,
      mrp: originalPrice,
      quantity: 1,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((prev) => !prev);
  }

  return (
    <div className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(28,28,28,0.25)]">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-cream">
        <span
          className={`absolute left-3 top-3 z-10 rounded-md bg-sale font-bold text-white ${
            compact ? "px-1.5 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs" : "px-2 py-1 text-xs"
          }`}
        >
          -{discount}%
        </span>
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <ProductArt accent={accent} count={count} />
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleWishlistClick}
        aria-label={wishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        aria-pressed={wishlisted}
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-muted shadow-sm transition-colors hover:text-sale"
      >
        <IconHeart className={`h-4 w-4 ${wishlisted ? "fill-sale text-sale" : ""}`} />
      </button>

      <div className={compact ? "flex flex-1 flex-col p-2.5 sm:p-5" : "flex flex-1 flex-col p-4 sm:p-5"}>
        <Link href={href}>
          <h3
            className={`break-words font-display font-semibold leading-snug text-ink hover:text-brand ${
              compact
                ? "line-clamp-2 min-h-[30px] text-xs sm:min-h-[44px] sm:text-base"
                : "line-clamp-2 min-h-[41px] text-[15px] sm:min-h-[44px] sm:text-base"
            }`}
          >
            {name}
          </h3>
        </Link>

        <div className={`flex items-baseline gap-1.5 sm:gap-2 ${compact ? "mt-1.5 sm:mt-2" : "mt-2"}`}>
          <span className={`font-bold text-ink ${compact ? "text-sm sm:text-lg" : "text-lg"}`}>
            Rs. {price.toFixed(2)}
          </span>
          <span className={`text-ink-faint line-through ${compact ? "text-[10px] sm:text-sm" : "text-sm"}`}>
            Rs. {originalPrice.toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark ${
            compact
              ? "mt-2.5 h-8 text-[10px] sm:mt-4 sm:h-10 sm:text-xs"
              : "mt-4 h-10 text-xs"
          }`}
        >
          <IconCart className={compact ? "h-3 w-3 sm:h-4 sm:w-4" : "h-4 w-4"} />
          {justAdded ? "Added" : "Add to Cart"}
        </button>

        <ul
          className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border ${
            compact ? "mt-2.5 hidden pt-2.5 sm:flex sm:mt-3.5 sm:pt-3.5" : "mt-3.5 pt-3.5"
          }`}
        >
          {tags.map((tag) => (
            <li key={tag} className="flex items-center gap-1 text-[11px] font-medium text-ink-muted">
              <IconCheck className="h-3 w-3 text-brand" />
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
