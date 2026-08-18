"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import WishlistProductCard from "./WishlistProductCard";
import { ALL_PRODUCTS, INITIAL_WISHLIST_IDS } from "./wishlist-data";
import { IconChevronRight, IconHeart } from "../ui/icons";

export default function WishlistPageClient() {
  const [wishlistIds, setWishlistIds] = useState<string[]>(INITIAL_WISHLIST_IDS);

  const wishlistItems = useMemo(
    () => ALL_PRODUCTS.filter((product) => wishlistIds.includes(product.id)),
    [wishlistIds]
  );

  const toggleWishlist = (id: string) => {
    setWishlistIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1.5 text-xs font-medium text-ink-muted sm:text-sm"
      >
        <Link href="/" className="transition-colors hover:text-brand">
          Home
        </Link>
        <IconChevronRight className="h-3.5 w-3.5 text-ink-faint" />
        <span className="font-semibold text-ink">Wishlist</span>
      </nav>

      {/* Title */}
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
        My Wishlist
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
      </p>

      {/* Saved items */}
      <div className="mt-6">
        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <IconHeart className="h-10 w-10 text-ink-faint" />
            <p className="mt-4 text-base font-semibold text-ink">No data found</p>
            <p className="mt-1 text-sm text-ink-muted">
              Save products you love and they&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {wishlistItems.map((product) => (
              <WishlistProductCard
                key={product.id}
                product={product}
                isWishlisted
                onToggleWishlist={() => toggleWishlist(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
