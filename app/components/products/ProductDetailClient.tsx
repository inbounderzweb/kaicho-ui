"use client";

import { useState } from "react";
import Breadcrumbs from "../ui/Breadcrumbs";
import ProductGallery from "./ProductGallery";
import ProductPrice from "./ProductPrice";
import ProductAvailability from "./ProductAvailability";
import QuantitySelector from "./QuantitySelector";
import RelatedProducts from "./RelatedProducts";
import { IconCart, IconHeart } from "../ui/icons";
import { useAuthGate } from "@/lib/auth/useAuthGate";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useToggleWishlist } from "@/lib/hooks/useToggleWishlist";
import { useRelatedProducts } from "@/lib/hooks/useRelatedProducts";
import { useCartStore } from "@/lib/store/cart.store";
import { resolveMediaUrl } from "@/lib/api/client";
import type { PublicProductDetail } from "@/lib/api/publicProducts";

const PAYMENT_METHODS = ["UPI", "Visa", "Mastercard", "RuPay", "COD"];

export default function ProductDetailClient({ product }: { product: PublicProductDetail }) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { guard } = useAuthGate();

  const { data: wishlist } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const { data: relatedData, isLoading: relatedLoading } = useRelatedProducts(product.slug);

  const addItem = useCartStore((s) => s.addItem);

  const inWishlist = Boolean(wishlist?.items.some((i) => i.productId === product.productId));
  const primaryImage = product.images[0];
  const outOfStock = !product.inventory.inStock;

  function handleAddToCart() {
    if (outOfStock) return;
    addItem({
      productId: product.productId,
      slug: product.slug,
      name: product.name,
      image: primaryImage ? resolveMediaUrl(primaryImage.thumbnailUrl ?? primaryImage.url) : null,
      imageAlt: primaryImage?.altText || product.name,
      price: product.pricing.sellingPrice,
      mrp: product.pricing.mrp,
      quantity,
      maxQuantity: product.inventory.trackInventory ? product.inventory.stockQuantity : undefined,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    ...(product.category ? [{ label: product.category.name, href: `/category/${product.category.slug}` }] : []),
    { label: product.name, href: `/products/${product.slug}` },
  ];

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-6" />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} productName={product.name} />

        {/* Info */}
        <div className="min-w-0">
          {product.brand && (
            <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{product.brand.name}</p>
          )}
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-4">
            <ProductPrice pricing={product.pricing} size="lg" />
          </div>

          <div className="mt-2">
            <ProductAvailability inventory={product.inventory} />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base">{product.shortDescription}</p>

          {/* Qty + Add to Cart + Wishlist */}
          <div className="mt-6 flex items-center gap-2 sm:gap-3">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={product.inventory.trackInventory ? product.inventory.stockQuantity : undefined}
              disabled={outOfStock}
            />

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
            >
              <IconCart className="h-4 w-4 shrink-0" />
              {outOfStock ? "Out of Stock" : justAdded ? "Added to Cart" : "Add to Cart"}
            </button>

            <button
              type="button"
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={inWishlist}
              disabled={toggleWishlist.isPending}
              onClick={() =>
                guard(() => toggleWishlist.mutate({ productId: product.productId, inWishlist }))
              }
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
                inWishlist
                  ? "border-brand text-brand"
                  : "border-border text-ink-muted hover:border-brand hover:text-brand"
              }`}
            >
              <IconHeart className="h-4 w-4" fill={inWishlist ? "currentColor" : "none"} />
            </button>
          </div>

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

      {/* Full description — the only long-form product content the real
          data model has (no fabricated ingredients/benefits/spec table). */}
      <div className="mt-16 border-t border-border pt-12 sm:mt-20 sm:pt-16">
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Product Details</h2>
        <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-muted sm:text-base">
          {product.description}
        </p>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-faint">SKU: {product.sku}</p>
      </div>

      {!relatedLoading && relatedData && <RelatedProducts products={relatedData.products} />}
    </section>
  );
}
