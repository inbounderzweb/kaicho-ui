"use client";

import { useCartStore } from "@/lib/store/cart.store";
import type { CheckoutPreviewOffer } from "@/lib/api/checkout";
import type { CartItem } from "./cart-data";
import FreeProductPicker from "./FreeProductPicker";

// Cart-side offer panel (Buy X Get Y Free, percentage or fixed amount off).
// Every number and every verdict shown here comes
// from the server's evaluation of the cart (useCartOffer) — this component
// only renders it and records the shopper's PREFERENCE for which units are
// free. A preference the server rejects (a free item costing more than the
// item bought, over the cap, …) is shown with the server's reason and that
// unit simply stays paid.
export default function CartOfferPanel({
  offer,
  items,
  isRefreshing,
}: {
  offer: CheckoutPreviewOffer;
  items: CartItem[];
  isRefreshing: boolean;
}) {
  const freeSelections = useCartStore((s) => s.freeSelections);
  const setFreeSelection = useCartStore((s) => s.setFreeSelection);
  const setMode = useCartStore((s) => s.setFreeSelectionMode);

  // "I'll choose" counts only while something is actually picked; an empty
  // choice falls back to the automatic allocation (see toFreeSelectionArray).
  const manual = freeSelections !== null && Object.values(freeSelections).some((q) => q > 0);
  const isBogo = (offer.type ?? "BOGO") === "BOGO";
  const separateFree = offer.mode === "BOGO_ROLES" || offer.mode === "BOGO_MAPPED";
  // BOGO offers that can suggest free products (pooled and per-product mapped) get the dedicated
  // picker; its suggestions already honour the offer mapping and the price rule.
  const useFreePicker = isBogo && (offer.mode === "BOGO_MAPPED" || (offer.freeOptions?.length ?? 0) > 0);
  // The items the shopper may pick as their free one: with a separate free list
  // only those products, otherwise any item the offer covers.
  const pickable = new Set(offer.freeCandidateProductIds ?? offer.eligibleProductIds);
  // Only plain UNIT lines can be free (a pack's blended price isn't a unit price).
  const eligibleLines = isBogo && !useFreePicker
    ? items.filter((i) => pickable.has(i.productId) && (i.selectionType ?? "UNIT") === "UNIT")
    : [];
  const nameOf = (productId: string) => items.find((i) => i.productId === productId)?.name ?? "This item";

  // The admin's own offer title.
  const label = offer.name;

  return (
    <section
      aria-label={`Offer: ${label}`}
      className={`rounded-2xl border border-brand/25 bg-brand-soft p-4 transition-opacity sm:p-5 ${isRefreshing ? "opacity-70" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-brand px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white">{label}</span>
      </div>
      {/* Guidance only: what applied is already clear from the free item and the order summary. */}
      {isBogo && !offer.applied && !useFreePicker && (
        <p aria-live="polite" className="mt-3 text-sm font-semibold text-ink">
          {offer.needsFreeProduct
            ? "Add one of the offer's free items to your cart to get it free."
            : offer.unitsToNextFree > 0
              ? separateFree
                ? `Add ${offer.unitsToNextFree} more qualifying item${offer.unitsToNextFree === 1 ? "" : "s"} to get your free item.`
                : `Add ${offer.unitsToNextFree} more eligible item${offer.unitsToNextFree === 1 ? "" : "s"} to get one free.`
              : "No free item yet."}
        </p>
      )}
      {isBogo && offer.limitReached && (
        <p className="mt-1 text-xs font-semibold text-amber-700">
          Maximum of {offer.maxFreeUnitsPerOrder} free item{offer.maxFreeUnitsPerOrder === 1 ? "" : "s"} per order reached.
        </p>
      )}
      {useFreePicker && <FreeProductPicker offer={offer} isRefreshing={isRefreshing} />}

      {eligibleLines.length > 0 && (
        <div className="mt-3 border-t border-brand/15 pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Your free item</p>
            <div role="group" aria-label="How to choose free items" className="inline-flex rounded-full border border-border bg-white p-0.5 text-xs font-semibold">
              <button
                type="button"
                aria-pressed={!manual}
                onClick={() => setMode("AUTO")}
                className={`rounded-full px-3 py-1 transition-colors ${!manual ? "bg-brand text-white" : "text-ink-muted"}`}
              >
                Best savings
              </button>
              <button
                type="button"
                aria-pressed={manual}
                onClick={() => setMode("MANUAL", offer.freeByProduct)}
                className={`rounded-full px-3 py-1 transition-colors ${manual ? "bg-brand text-white" : "text-ink-muted"}`}
              >
                I&apos;ll choose
              </button>
            </div>
          </div>

          {manual ? (
            <ul className="mt-2 space-y-2">
              {eligibleLines.map((line) => {
                const picked = Math.min(freeSelections?.[line.productId] ?? 0, line.quantity);
                return (
                  <li key={line.productId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {line.name} <span className="text-ink-faint">· Rs. {line.price.toFixed(2)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-ink-muted">
                      Free
                      <span className="flex items-center rounded-full border border-border bg-white">
                        <button
                          type="button"
                          aria-label={`Fewer free ${line.name}`}
                          disabled={picked <= 0}
                          onClick={() => setFreeSelection(line.productId, picked - 1)}
                          className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-ink">{picked}</span>
                        <button
                          type="button"
                          aria-label={`More free ${line.name}`}
                          disabled={picked >= line.quantity}
                          onClick={() => setFreeSelection(line.productId, picked + 1)}
                          className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
                        >
                          +
                        </button>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-ink-muted">
              We automatically choose the free items for you. Switch to &ldquo;I&apos;ll choose&rdquo; to decide yourself.
            </p>
          )}
        </div>
      )}

      {offer.rejected.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1">
          {offer.rejected.map((r, i) => (
            <li key={`${r.productId}-${r.reason}-${i}`} className="rounded-lg bg-sale/10 px-3 py-2 text-xs font-semibold text-sale">
              {nameOf(r.productId)}: {r.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
