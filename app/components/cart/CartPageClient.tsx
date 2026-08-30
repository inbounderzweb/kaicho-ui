"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import CartItemRow from "./CartItemRow";
import ShippingProgress from "./ShippingProgress";
import { FREE_SHIPPING_THRESHOLD } from "./cart-data";
import { useCartStore } from "@/lib/store/cart.store";
import { useAuthGate } from "@/lib/auth/useAuthGate";
import { IconArrowRight, IconCart, IconChevronRight } from "../ui/icons";

export default function CartPageClient() {
  const router = useRouter();
  const { guard, isLoading: isAuthLoading } = useAuthGate();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    updateQuantity(productId, quantity);
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
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
        <span className="font-semibold text-ink">Shopping Cart</span>
      </nav>

      {/* Title */}
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
        Shopping Cart
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
      </p>

      {/* Free shipping / cashback progress */}
      <div className="mt-6">
        <ShippingProgress subtotal={subtotal} />
      </div>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <IconCart className="h-10 w-10 text-ink-faint" />
          <p className="mt-4 text-base font-semibold text-ink">Your cart is empty</p>
          <p className="mt-1 text-sm text-ink-muted">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Button href="/products" className="mt-6">
            Continue Shopping
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Items list */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
              <div className="hidden border-b border-border pb-3 text-xs font-bold uppercase tracking-wider text-ink-faint sm:flex sm:items-center sm:justify-between">
                <span>Product</span>
                <div className="flex items-center gap-8">
                  <span className="w-20">Price</span>
                  <span className="w-[88px] text-center">Quantity</span>
                  <span className="w-20 text-right">Total</span>
                  <span className="w-8" />
                </div>
              </div>

              {items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-white p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-bold text-ink">Order Summary</h2>

              <div className="mt-4 space-y-2.5 border-b border-border pb-4 text-sm">
                <div className="flex justify-between text-ink-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Shipping</span>
                  <span
                    className={`font-semibold ${
                      subtotal >= FREE_SHIPPING_THRESHOLD ? "text-brand" : "text-ink"
                    }`}
                  >
                    {subtotal >= FREE_SHIPPING_THRESHOLD ? "Free" : "Calculated at checkout"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-base font-bold text-ink">Total</span>
                <span className="text-xl font-extrabold text-brand">
                  Rs. {subtotal.toFixed(2)}
                </span>
              </div>

              {/* These totals are display-only client-side snapshots — the
                  checkout page ignores them and re-prices every line
                  server-side via /checkout/preview. Login is required, so
                  the click goes through useAuthGate(), which bounces to
                  /login?redirect=/cart and returns here afterwards. */}
              <button
                type="button"
                onClick={() => guard(() => router.push("/checkout"))}
                disabled={isAuthLoading}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand/40"
              >
                Proceed to Checkout
                <IconArrowRight className="h-4 w-4" />
              </button>

              <Link
                href="/products"
                className="mt-3 block text-center text-xs font-semibold text-ink-muted transition-colors hover:text-brand"
              >
                or Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
