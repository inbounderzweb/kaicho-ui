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
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 sm:bottom-6 sm:justify-end sm:px-6"
    >
      <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
        <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold">
          ✓
        </span>
        <span className="min-w-0 truncate">
          <span className="font-semibold">{message}</span> added to cart
        </span>
        <Link href="/cart" onClick={hide} className="shrink-0 font-bold text-white underline underline-offset-2">
          View cart
        </Link>
      </div>
    </div>
  );
}
