"use client";

import Link from "next/link";
import Button from "../ui/Button";
import Breadcrumbs from "../ui/Breadcrumbs";
import ProductCard from "../products/ProductCard";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { IconArrowRight, IconHeart } from "../ui/icons";

export default function WishlistPageClient() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: wishlist, isLoading: wishlistLoading, isError, refetch } = useWishlist();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Wishlist", href: "/wishlist" },
  ];

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={breadcrumbs} className="mb-4" />

      <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
        My Wishlist
      </h1>
      {wishlist && (
        <p className="mt-1 text-sm text-ink-muted">
          {wishlist.total} {wishlist.total === 1 ? "item" : "items"} saved
        </p>
      )}

      <div className="mt-6">
        {!userLoading && !user ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <IconHeart className="h-10 w-10 text-ink-faint" />
            <p className="mt-4 text-base font-semibold text-ink">Sign in to see your wishlist</p>
            <p className="mt-1 text-sm text-ink-muted">Save products you love and find them here anytime.</p>
            <Button href="/login?redirect=/wishlist" className="mt-6">
              Sign In
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="text-base font-semibold text-ink">Something went wrong</p>
            <p className="mt-1 text-sm text-ink-muted">We couldn&apos;t load your wishlist right now.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : userLoading || wishlistLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-border bg-white">
                <div className="aspect-square w-full bg-cream" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 rounded bg-cream" />
                  <div className="h-4 w-1/3 rounded bg-cream" />
                </div>
              </div>
            ))}
          </div>
        ) : !wishlist || wishlist.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <IconHeart className="h-10 w-10 text-ink-faint" />
            <p className="mt-4 text-base font-semibold text-ink">Your wishlist is empty</p>
            <p className="mt-1 text-sm text-ink-muted">Save products you love and they&apos;ll show up here.</p>
            <Button href="/products" className="mt-6">
              Browse Products
              <IconArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {wishlist.items.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </div>

      {wishlist && wishlist.items.length > 0 && (
        <p className="mt-6 text-center text-xs text-ink-faint">
          Looking for more? <Link href="/products" className="font-semibold text-brand">Continue shopping</Link>
        </p>
      )}
    </section>
  );
}
