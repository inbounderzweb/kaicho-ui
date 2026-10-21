"use client";

import { useMemo, useSyncExternalStore } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { evaluateCartOffers } from "../api/offer";
import type { CheckoutLineInput } from "../api/checkout";
import { useCartStore } from "../store/cart.store";
import { publicOfferKeys } from "./query-keys";

/** Cart lines in the untrusted wire shape — ids + quantities (+ pack picks), never a price. */
export function toCheckoutLines(items: ReturnType<typeof useCartStore.getState>["items"]): CheckoutLineInput[] {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    packSelection:
      item.selectionType === "PACK" && item.packBreakdown?.length
        ? item.packBreakdown.map((l) => ({ packId: l.packId, count: l.packCount }))
        : undefined,
  }));
}

/** The manual free picks as the wire array (undefined = AUTO), pruned to what's still in the cart. */
export function toFreeSelectionArray(
  freeSelections: Record<string, number> | null,
  items: { productId: string }[]
): { productId: string; quantity: number }[] | undefined {
  if (!freeSelections) return undefined;
  const inCart = new Set(items.map((i) => i.productId));
  return Object.entries(freeSelections)
    .filter(([productId, quantity]) => quantity > 0 && inCart.has(productId))
    .map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * Prices the cart on the SERVER with the live offer applied (guest-safe), so
 * the cart page can show FREE units and the real discount. Re-runs whenever
 * the cart lines or the shopper's free picks change; the previous result is
 * kept on screen meanwhile so numbers don't flicker.
 */
export function useCartOffer() {
  const items = useCartStore((s) => s.items);
  const freeSelections = useCartStore((s) => s.freeSelections);
  const hydrated = useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );

  const lines = useMemo(() => toCheckoutLines(items), [items]);
  const selection = useMemo(() => toFreeSelectionArray(freeSelections, items), [freeSelections, items]);
  const key = useMemo(() => JSON.stringify({ lines, selection }), [lines, selection]);

  return useQuery({
    queryKey: publicOfferKeys.evaluate(key),
    queryFn: () => evaluateCartOffers(lines, selection),
    enabled: hydrated && lines.length > 0,
    staleTime: 10_000,
    placeholderData: keepPreviousData,
    retry: 1,
  });
}
