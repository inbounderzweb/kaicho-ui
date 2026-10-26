"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCartToastStore } from "@/lib/store/cartToast.store";

const VISIBLE_MS = 3000;

// Small confirmation shown whenever a shopper presses an "Add to cart" button,
// so they know the product went in without opening the cart. Mounted once in
// Providers; sits above the mobile bottom nav.
export default function AddToCartToast() {
  const id = useCartToastStore((s) => s.id);
  const message = useCartToastStore((s) => s.message);
  const hide = useCartToastStore((s) => s.hide);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(t);
  }, [id, message, hide]);

  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 sm:bottom-6 sm:justify-end sm:px-6"
    >
      <div
        key={id}
        className="pointer-events-auto flex w-full max-w-sm animate-[fade-up_.35s_cubic-bezier(.2,.8,.2,1)_both] items-center gap-3 rounded-2xl bg-ink py-2.5 pl-3 pr-2.5 text-white shadow-[0_10px_30px_rgba(0,0,0,.28)] ring-1 ring-white/10 motion-reduce:animate-none"
      >
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-semibold">{message}</span>
          <span className="block text-xs text-white/60">Added to cart</span>
        </span>
        <Link
          href="/cart"
          onClick={hide}
          className="shrink-0 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-ink transition active:scale-95"
        >
          View cart
        </Link>
      </div>
    </div>
  );
}
