"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/api/client";
import type { PublicRelatedCombo } from "@/lib/api/publicProducts";

// "You're adding [Product]. We also have [Combo]" — shown BEFORE the
// pack-quantity check (PackRecommendationModal), since "switch to a
// completely different product" is a bigger decision than "which pack
// size of this one." Choosing to continue falls through to that existing,
// unmodified flow. Same dialog contract as PackRecommendationModal/
// CancelOrderDialog (role="alertdialog", Escape to dismiss, scroll-locked).
//
// Unlike a pack, "switch" doesn't try to swap the cart in place — it
// navigates to the combo's own product page, which already has its own
// correct price/availability/pack options. The current product's cart is
// left untouched until the customer acts there.
export default function RelatedComboModal({
  open,
  productName,
  combo,
  onContinue,
  onViewCombo,
}: {
  open: boolean;
  productName: string;
  combo: PublicRelatedCombo | null;
  onContinue: () => void;
  onViewCombo: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onContinue();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onContinue]);

  if (!open || !combo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onContinue} />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-label="Related bundle available"
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-white p-5 shadow-xl"
      >
        <h2 className="font-display text-base font-bold text-ink">We also have a bundle</h2>
        <p className="mt-2 text-sm text-ink-muted">
          You&apos;re adding {productName}. Want to check out {combo.name} instead?
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-cream/40 p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
            {combo.image ? (
              <Image src={resolveMediaUrl(combo.image)} alt={combo.name} fill sizes="56px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-ink-faint">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{combo.name}</p>
            <p className="text-sm font-bold text-brand">
              Rs. {combo.price.toFixed(2)}
              {combo.discountPercentage > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-ink-faint line-through">
                  Rs. {combo.mrp.toFixed(2)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:border-brand hover:text-brand"
          >
            Continue with {productName}
          </button>
          <button
            type="button"
            onClick={onViewCombo}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            View {combo.name}
          </button>
        </div>
      </div>
    </div>
  );
}
