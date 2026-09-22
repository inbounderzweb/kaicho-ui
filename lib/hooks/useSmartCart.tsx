"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { apiFetch, resolveMediaUrl } from "@/lib/api/client";
import { useCartStore } from "@/lib/store/cart.store";
import type { CartItem } from "@/app/components/cart/cart-data";
import type { PackSelectionInput } from "@/lib/api/checkout";

type Selection = Omit<CartItem, "imageAlt"> & { totalPrice: number };
type Input = { productId: string; quantity: number; packSelection?: PackSelectionInput[] };
const inputFor = (item: Pick<CartItem, "productId" | "quantity" | "packBreakdown">): Input => ({
  productId: item.productId, quantity: item.quantity,
  ...(item.packBreakdown?.length ? { packSelection: item.packBreakdown.map(p => ({ packId: p.packId, count: p.packCount })) } : {}),
});
const currentCart = () => useCartStore.getState().items.map(inputFor);
const money = (amount: number) => amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function useSmartCart(productId: string) {
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [offer, setOffer] = useState<{ current: Selection; recommendation: Selection } | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { generation.current++; clearTimeout(timer.current); }, [productId]);

  const commit = (selection: Selection) => {
    useCartStore.getState().addItem({ ...selection, image: selection.image ? resolveMediaUrl(selection.image) : null, imageAlt: selection.name });
    setOffer(null);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 2000);
  };
  async function choose(selection: Selection) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    const version = generation.current;
    try {
      const cart = currentCart();
      const fresh = await apiFetch<Selection>("/cart/validate-selection", { method: "POST", body: JSON.stringify({ selection: inputFor(selection), cart }) });
      if (version !== generation.current) return;
      if (JSON.stringify(cart) !== JSON.stringify(currentCart())) throw new Error("Your cart changed. Please choose again to recheck availability.");
      if (fresh.totalPrice !== selection.totalPrice || fresh.quantity !== selection.quantity) {
        setOffer(previous => previous ? { ...previous, ...(previous.current === selection ? { current: fresh } : { recommendation: fresh }) } : null);
        setError("This selection has changed. Review the updated price and choose again.");
        return;
      }
      commit(fresh);
    } catch (err) { if (version === generation.current) setError(err instanceof Error ? err.message : "Could not validate this selection. Please try again."); }
    finally { lock.current = false; if (version === generation.current) setBusy(false); }
  }
  async function add(quantity: number) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    const version = generation.current;
    try {
      const cart = currentCart();
      const result = await apiFetch<{ current: Selection; recommendation: Selection | null }>("/cart/recommend", { method: "POST", body: JSON.stringify({ selection: { productId, quantity }, cart }) });
      if (version !== generation.current) return;
      if (JSON.stringify(cart) !== JSON.stringify(currentCart())) throw new Error("Your cart changed. Please add again to recheck availability.");
      if (result.recommendation) setOffer({ current: result.current, recommendation: result.recommendation });
      else commit(result.current);
    } catch (err) { if (version === generation.current) setError(err instanceof Error ? err.message : "Could not check availability. Please try again."); }
    finally { lock.current = false; if (version === generation.current) setBusy(false); }
  }
  return {
    add, busy, added, error,
    modal: offer ? <SmartCartDialog current={offer.current} recommendation={offer.recommendation} busy={busy} error={error} onChoose={choose} onClose={() => { if (!lock.current) setOffer(null); }} /> : null,
  };
}

function SmartCartDialog({ current, recommendation, busy, error, onChoose, onClose }: {
  current: Selection; recommendation: Selection; busy: boolean; error: string;
  onChoose: (selection: Selection) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [hovered, setHovered] = useState<"current" | "recommendation" | null>(null);
  const [focused, setFocused] = useState<"current" | "recommendation" | null>(null);
  const preview = (hovered ?? focused) === "current" ? current : recommendation;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const previewImage = preview.image ? resolveMediaUrl(preview.image) : null;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.current?.showModal(); document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(
    <dialog ref={dialog} aria-labelledby="smart-cart-title" onCancel={event => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-border bg-white p-5 text-ink shadow-xl backdrop:bg-black/50 sm:p-7">
      <div className="flex items-start justify-between gap-3"><h2 id="smart-cart-title" className="font-display text-xl font-semibold">Recommended for you</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close recommendation" className="h-8 w-8 shrink-0 rounded-full border border-border">×</button></div>
      <p className="mt-3 text-sm leading-6 text-ink-muted">Keep {current.name} × {current.quantity} for {money(current.totalPrice)}, or choose the option below.</p>
      <figure className="mt-4 overflow-hidden rounded-xl border border-border bg-cream">
        <div className="relative h-40 sm:h-48">
          {previewImage && previewImage !== failedImage ? (
            <Image src={previewImage} alt={preview.name} fill unoptimized sizes="(max-width: 640px) 85vw, 390px" className="object-contain p-3" onError={() => setFailedImage(previewImage)} />
          ) : <div className="flex h-full items-center justify-center px-4 text-sm text-ink-muted">Image unavailable</div>}
        </div>
        <figcaption className="px-3 pb-3 text-center text-sm font-medium">{preview.name}{preview.selectionType === "PACK" ? ` · ${preview.packBreakdown?.map(pack => `${pack.packName} × ${pack.packCount}`).join(", ")}` : ""}</figcaption>
      </figure>
      <div className="mt-5 rounded-xl border border-brand/20 bg-brand-soft p-4">
        <p className="font-semibold">{recommendation.name}</p>
        {recommendation.packBreakdown?.map(pack => <p key={pack.packId} className="mt-2 text-sm">{pack.packName} × {pack.packCount} · {money(pack.packPrice * pack.packCount)}</p>)}
        <p className="mt-3 text-sm">Total quantity: {recommendation.quantity}</p>
        <p className="mt-1 text-lg font-bold text-brand-dark">{money(recommendation.totalPrice)}</p>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex flex-col gap-3">
        <button type="button" disabled={busy} onMouseEnter={() => setHovered("recommendation")} onMouseLeave={() => setHovered(null)} onFocus={() => setFocused("recommendation")} onBlur={() => setFocused(null)} onClick={() => onChoose(recommendation)} className="rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Checking availability…" : recommendation.selectionType === "PACK" ? "Choose Pack" : "Choose Combo"}</button>
        <button type="button" disabled={busy} onMouseEnter={() => setHovered("current")} onMouseLeave={() => setHovered(null)} onFocus={() => setFocused("current")} onBlur={() => setFocused(null)} onClick={() => onChoose(current)} className="rounded-full border border-border px-4 py-3 text-sm font-semibold disabled:opacity-50">Continue with Current Selection</button>
      </div>
    </dialog>, document.body,
  );
}
