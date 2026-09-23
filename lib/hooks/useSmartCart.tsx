"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, resolveMediaUrl } from "@/lib/api/client";
import { useCartStore } from "@/lib/store/cart.store";
import { IconCart, IconCheck } from "@/app/components/ui/icons";
import { cartLineKey, type CartItem } from "@/app/components/cart/cart-data";
import type { PackSelectionInput } from "@/lib/api/checkout";

type Selection = Omit<CartItem, "imageAlt"> & { totalPrice: number; shortDescription?: string };
type Input = { productId: string; quantity: number; packSelection?: PackSelectionInput[] };
const inputFor = (item: Pick<CartItem, "productId" | "quantity" | "packBreakdown">): Input => ({
  productId: item.productId, quantity: item.quantity,
  ...(item.packBreakdown?.length ? { packSelection: item.packBreakdown.map(p => ({ packId: p.packId, count: p.packCount })) } : {}),
});
const currentCart = () => useCartStore.getState().items.map(inputFor);
// The one place a priced Selection becomes a cart row, so every add/remove
// path agrees on the shape (and `shortDescription`, which is display-only,
// never reaches persisted cart storage).
const toCartItem = (selection: Selection): CartItem => ({
  productId: selection.productId,
  slug: selection.slug,
  name: selection.name,
  image: selection.image ? resolveMediaUrl(selection.image) : null,
  imageAlt: selection.name,
  price: selection.price,
  mrp: selection.mrp,
  quantity: selection.quantity,
  ...(selection.maxQuantity !== undefined ? { maxQuantity: selection.maxQuantity } : {}),
  ...(selection.selectionType ? { selectionType: selection.selectionType } : {}),
  ...(selection.packBreakdown ? { packBreakdown: selection.packBreakdown } : {}),
});
const money = (amount: number) => amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function useSmartCart(productId: string) {
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [offer, setOffer] = useState<{ current: Selection; recommendations: Selection[] } | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { generation.current++; clearTimeout(timer.current); }, [productId]);

  const commit = (selection: Selection) => {
    useCartStore.getState().addItem(toCartItem(selection));
    setOffer(null);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2000);
  };
  // Adds ONE more of `selection` to the cart — the dialog's "Add" and its
  // "+" are the same operation, because adding a second of something is
  // exactly what has to be re-checked against live stock. The dialog stays
  // open either way: the customer may want several of these cards.
  // Deliberately still goes through validate-selection first, so a stale
  // price or a since-sold-out combo is caught BEFORE it reaches the cart
  // (requirement: never show it as added if the request failed).
  async function addSelection(selection: Selection) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    const version = generation.current;
    try {
      const cart = currentCart();
      const fresh = await apiFetch<Selection>("/cart/validate-selection", { method: "POST", body: JSON.stringify({ selection: inputFor(selection), cart }) });
      if (version !== generation.current) return;
      if (JSON.stringify(cart) !== JSON.stringify(currentCart())) throw new Error("Your cart changed. Please try again to recheck availability.");
      if (fresh.totalPrice !== selection.totalPrice || fresh.quantity !== selection.quantity) {
        // Re-priced under us: show the new numbers and add nothing, so the
        // customer confirms the price they're actually paying.
        setOffer(previous => !previous ? null : previous.current === selection
          ? { ...previous, current: fresh }
          : { ...previous, recommendations: previous.recommendations.map(item => item === selection ? fresh : item) });
        setError("This selection has changed. Review the updated price and add again.");
        return;
      }
      useCartStore.getState().addItem(toCartItem(fresh));
    } catch (err) { if (version === generation.current) setError(err instanceof Error ? err.message : "Could not add this to your cart. Please try again."); }
    finally { lock.current = false; if (version === generation.current) setBusy(false); }
  }
  // Takes one back out. No server round-trip: removing can never violate
  // stock, so the stepper stays instant on the way down, and the store drops
  // the row entirely once nothing is left.
  function removeSelection(selection: Selection) {
    if (lock.current) return;
    setError("");
    useCartStore.getState().decrementItem(toCartItem(selection));
  }
  async function add(quantity: number) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    const version = generation.current;
    try {
      const cart = currentCart();
      const result = await apiFetch<{ current: Selection; recommendation: Selection | null; recommendations?: Selection[] }>("/cart/recommend", { method: "POST", body: JSON.stringify({ selection: { productId, quantity }, cart }) });
      if (version !== generation.current) return;
      if (JSON.stringify(cart) !== JSON.stringify(currentCart())) throw new Error("Your cart changed. Please add again to recheck availability.");
      // `recommendations` is the full ranked list; `recommendation` is the
      // same list's first entry, kept for older responses.
      const offered = result.recommendations?.length ? result.recommendations : result.recommendation ? [result.recommendation] : [];
      if (offered.length) setOffer({ current: result.current, recommendations: offered });
      else commit(result.current);
    } catch (err) { if (version === generation.current) setError(err instanceof Error ? err.message : "Could not check availability. Please try again."); }
    finally { lock.current = false; if (version === generation.current) setBusy(false); }
  }
  return {
    add, busy, added, error,
    modal: offer ? <SmartCartDialog current={offer.current} recommendations={offer.recommendations} busy={busy} error={error} onAdd={addSelection} onRemove={removeSelection} onClose={() => { if (!lock.current) setOffer(null); }} /> : null,
  };
}

// Shared thumbnail-with-fallback — used for both the square "current
// selection" card and the recommendation's row card, each getting its own
// independent failed-image state since they show two different products.
function ProductThumb({ src, alt, containerClassName, sizes }: {
  src: string | null; alt: string; containerClassName: string; sizes: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <div className={containerClassName}>
      {src && src !== failed ? (
        <Image src={src} alt={alt} fill unoptimized sizes={sizes} className="object-contain p-1.5" onError={() => setFailed(src)} />
      ) : <div className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-tight text-ink-muted">No image</div>}
    </div>
  );
}

// Stable per-card identity: the same product can legitimately appear twice
// as two different pack combinations, so productId alone isn't enough.
const keyFor = (selection: Selection) =>
  `${selection.productId}:${selection.packBreakdown?.map(pack => `${pack.packId}x${pack.packCount}`).join(",") ?? "unit"}`;

// Add button ⇄ quantity stepper, driven entirely by what's actually in the
// cart — this component owns no quantity of its own, so the control can
// never drift from the cart (including when the cart changes from somewhere
// else while the dialog is open). Each card subscribes independently, so
// stepping one card re-renders only that card.
//
// The number shown is how many of THIS selection are in the cart, which for
// a pack means whole packs, not base units: a "Combo of 3" added twice is 6
// units in the cart but reads "2" here, and stepping it moves in whole packs
// (see decrementItem in cart.store.ts).
function CartControl({ selection, busy, pending, onAdd, onRemove }: {
  selection: Selection; busy: boolean; pending: boolean; onAdd: () => void; onRemove: () => void;
}) {
  const line = useCartStore(state => state.items.find(item => cartLineKey(item) === cartLineKey(selection)));
  const perSelection = Math.max(1, selection.quantity);
  const count = line ? Math.max(1, Math.round(line.quantity / perSelection)) : 0;
  const stepper = "flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-brand-dark transition-colors hover:bg-brand-soft disabled:opacity-40";

  if (count === 0) {
    return (
      <button type="button" disabled={busy} onClick={onAdd} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-brand bg-white px-5 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft active:scale-95 disabled:opacity-60">
        {pending ? "Adding…" : <><span className="text-lg leading-none">+</span> Add</>}
      </button>
    );
  }
  return (
    <div className="inline-flex h-11 shrink-0 items-center rounded-full border border-brand bg-white px-1">
      <button type="button" disabled={busy} onClick={onRemove} aria-label={`Remove one ${selection.name}`} className={stepper}>−</button>
      <span aria-live="polite" className="min-w-8 text-center text-sm font-bold text-brand-dark">{pending ? "…" : count}</span>
      <button type="button" disabled={busy} onClick={onAdd} aria-label={`Add one more ${selection.name}`} className={stepper}>+</button>
    </div>
  );
}

function ComboCard({ selection, busy, pending, onAdd, onRemove }: {
  selection: Selection; busy: boolean; pending: boolean; onAdd: () => void; onRemove: () => void;
}) {
  const image = selection.image ? resolveMediaUrl(selection.image) : null;
  const packLine = selection.packBreakdown?.length
    ? selection.packBreakdown.map(pack => `${pack.packName} × ${pack.packCount}`).join(", ")
    : null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3 sm:gap-4">
      <ProductThumb src={image} alt={selection.name} sizes="96px" containerClassName="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-24 sm:w-24" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-sm font-semibold leading-snug sm:text-base">{selection.name}</p>
        <span className="w-fit rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-ink-muted">{selection.selectionType === "PACK" ? "Combo Pack" : "Combo"}</span>
        {selection.shortDescription && <p className="line-clamp-2 text-xs leading-5 text-ink-muted sm:text-sm">{selection.shortDescription}</p>}
        {packLine && <p className="truncate text-[11px] text-ink-faint">{packLine}</p>}
        <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-bold text-brand-dark sm:text-xl">{money(selection.totalPrice)}</p>
          <CartControl selection={selection} busy={busy} pending={pending} onAdd={onAdd} onRemove={onRemove} />
        </div>
      </div>
    </div>
  );
}

function SmartCartDialog({ current, recommendations, busy, error, onAdd, onRemove, onClose }: {
  current: Selection; recommendations: Selection[]; busy: boolean; error: string;
  onAdd: (selection: Selection) => void; onRemove: (selection: Selection) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const currentImage = current.image ? resolveMediaUrl(current.image) : null;
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.current?.showModal(); document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  // One in-flight add at a time (the hook's own lock enforces it), so the
  // spinner belongs to whichever card started it.
  const addHandler = (selection: Selection) => () => { setPendingKey(keyFor(selection)); onAdd(selection); };
  return createPortal(
    <dialog ref={dialog} aria-labelledby="smart-cart-title" onCancel={event => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-4 text-ink shadow-2xl backdrop:bg-black/50 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="smart-cart-title" className="font-display text-xl font-bold leading-tight sm:text-2xl">Recommended for you</h2>
          <p className="mt-1 text-sm text-ink-muted">Add this combo to save more, or keep what you already have.</p>
        </div>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Close recommendation" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-lg leading-none text-ink-muted transition-colors hover:bg-cream-deep disabled:opacity-50">×</button>
      </div>

      {/* The product this dialog was opened from — same add/step control as
          the recommendations, so nothing reaches the cart until it's asked
          for explicitly. */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand-soft/50 p-3 sm:gap-4">
        <ProductThumb src={currentImage} alt={current.name} sizes="96px" containerClassName="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-dark sm:text-xs">
            <IconCheck className="h-3.5 w-3.5" /> Your selection
          </span>
          <p className="mt-2 truncate text-sm font-semibold sm:text-base">{current.name}</p>
          <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">Qty {current.quantity}</p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-bold sm:text-xl">{money(current.totalPrice)}</p>
            <CartControl selection={current} busy={busy} pending={pendingKey === keyFor(current) && busy} onAdd={addHandler(current)} onRemove={() => onRemove(current)} />
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <>
          <div className="mt-5">
            <h3 className="font-display text-base font-bold sm:text-lg">Complete your combo</h3>
            <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">Add this recommended combo with your selection.</p>
          </div>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {recommendations.map(item => {
              const key = keyFor(item);
              // Only meaningful while a request is in flight, so a leftover
              // key from a finished attempt never shows a stale spinner.
              return <ComboCard key={key} selection={item} busy={busy} pending={busy && pendingKey === key} onAdd={addHandler(item)} onRemove={() => onRemove(item)} />;
            })}
          </div>
        </>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}

      {/* Pinned to the bottom of the dialog: with up to four combos the list
          scrolls, and the way out must never scroll out of reach. The
          negative margin lets its background cover the dialog's own padding
          so cards don't peek through underneath. */}
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-4 bg-white px-4 pb-4 pt-2 sm:-mx-5 sm:-mb-5 sm:px-5 sm:pb-5">
        <Link href="/cart" onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:text-base">
          <IconCart className="h-5 w-5" /> Continue with Cart
        </Link>
      </div>
    </dialog>, document.body,
  );
}
