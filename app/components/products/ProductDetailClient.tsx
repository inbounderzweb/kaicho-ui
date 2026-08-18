"use client";

import { useState } from "react";
import Link from "next/link";
import ProductGallery from "./ProductGallery";
import RelatedProducts from "./RelatedProducts";
import { IconCart, IconChevronRight, IconHeart } from "../ui/icons";
import type { SluggedProduct } from "../sections/product-data";
import type { ProductDetailContent } from "./product-detail-content";

const PAYMENT_METHODS = ["UPI", "Visa", "Mastercard", "RuPay", "COD"];

export default function ProductDetailClient({
  product,
  details,
  relatedProducts,
}: {
  product: SluggedProduct;
  details?: ProductDetailContent;
  relatedProducts: SluggedProduct[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-xs font-medium text-ink-muted sm:text-sm"
      >
        <Link href="/" className="transition-colors hover:text-brand">
          Home
        </Link>
        <IconChevronRight className="h-3.5 w-3.5 text-ink-faint" />
        <span className="font-semibold text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <ProductGallery accent={product.accent} />

        {/* Info */}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink-faint line-through">
              Rs. {product.originalPrice.toFixed(2)}
            </span>
            <span className="text-2xl font-bold text-ink">Rs. {product.price.toFixed(2)}</span>
            {discount > 0 && (
              <span className="rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-white">
                -{discount}%
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base">
            {details?.shortDescription ?? `${product.tags.join(" · ")}.`}
          </p>

          {details?.category && (
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-faint">
              Category:{" "}
              <span className="text-xs font-medium normal-case text-ink-muted">
                {details.category.join(", ")}
              </span>
            </p>
          )}

          {/* Qty + Add to Cart + Wishlist */}
          <div className="mt-6 flex items-center gap-2 sm:gap-3">
            <div className="flex h-11 shrink-0 items-center rounded-full border border-border">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-full w-8 items-center justify-center text-ink-muted transition-colors hover:text-brand disabled:opacity-30 sm:w-10"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold text-ink">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-full w-8 items-center justify-center text-ink-muted transition-colors hover:text-brand sm:w-10"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark sm:text-sm"
            >
              <IconCart className="h-4 w-4 shrink-0" />
              Add to Cart
            </button>

            <button
              type="button"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
              onClick={() => setWishlisted((w) => !w)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                wishlisted
                  ? "border-brand text-brand"
                  : "border-border text-ink-muted hover:border-brand hover:text-brand"
              }`}
            >
              <IconHeart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Direct buy */}
          <button
            type="button"
            className="mt-3 flex h-11 w-full items-center justify-center rounded-full border-2 border-brand text-sm font-bold uppercase tracking-wider text-brand transition-colors hover:bg-brand hover:text-white"
          >
            Buy It Now
          </button>

          {/* Payment methods */}
          <div className="mt-8 rounded-2xl border border-border p-4">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-ink-faint">
              Guaranteed Safe Checkout
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-border bg-cream/60 px-2.5 py-1 text-xs font-semibold text-ink-muted"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed description — only for products with authored content */}
      {details && (
        <div className="mt-16 border-t border-border pt-12 sm:mt-20 sm:pt-16">
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Product Details</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted sm:text-base">
            {details.fullDescription}
          </p>

          <h3 className="mt-10 font-display text-lg font-bold text-ink sm:text-xl">
            Ingredients &amp; Their Benefits
          </h3>
          <ul className="mt-4 max-w-3xl space-y-3">
            {details.ingredients.map((ingredient) => (
              <li key={ingredient.name} className="text-sm leading-relaxed text-ink-muted sm:text-base">
                <span className="font-semibold text-ink">{ingredient.name}:</span> {ingredient.benefit}
              </li>
            ))}
          </ul>

          <h3 className="mt-10 font-display text-lg font-bold text-ink sm:text-xl">
            Benefits of {product.name}
          </h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {details.benefits.map((benefit) => (
              <div key={benefit.title}>
                <p className="font-display text-sm font-bold text-ink sm:text-base">{benefit.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-5 rounded-2xl border border-border p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            <Spec label="Heating Instructions" value={details.heatingInstructions} />
            <Spec label="Storage Instructions" value={details.storageInstructions} />
            <Spec label="Allergen Information" value={details.allergenInfo} />
            <Spec label="Dietary Preferences" value={details.dietaryPreferences} />
            <Spec label="Product Form" value={details.productForm} />
            <Spec label="Shelf Life" value={details.shelfLife} />
            <Spec label="Packaging Type" value={details.packagingType} />
            <Spec label="Origin" value={details.origin} />
            {details.comboPricing && <Spec label="Combo Pricing" value={details.comboPricing} />}
          </div>
        </div>
      )}

      <RelatedProducts products={relatedProducts} />
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{value}</p>
    </div>
  );
}
