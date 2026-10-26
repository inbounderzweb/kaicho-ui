"use client";

import { useState } from "react";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/api/client";
import type { CheckoutPreviewOffer, FreeProductOption } from "@/lib/api/checkout";
import { useCartStore } from "@/lib/store/cart.store";

const SUGGESTED_COUNT = 3;
const rs = (n: number) => `Rs. ${n.toFixed(2)}`;

// Free-product suggestions for a Buy X Get Y Free offer. Which products appear,
// their order (biggest saving first), how many free units the cart earns and
// which are locked all come from the server, which has already applied the
// offer's product mapping, the "free costs no more than bought" price rule and
// live stock. The best option is pre-highlighted but NOTHING is added to the
// cart until the shopper presses "Confirm Free Product"; confirming adds the
// units and records a free pick, both of which the server re-validates.
export default function FreeProductPicker({ offer, isRefreshing }: { offer: CheckoutPreviewOffer; isRefreshing: boolean }) {
  const rewardNotice = useCartStore((s) => s.rewardNotice);
  const claimFreeProduct = useCartStore((s) => s.claimFreeProduct);
  const rewardUnits = useCartStore((s) => s.rewardUnits);

  const options = offer.freeOptions ?? [];
  const claimedIds = Object.keys(offer.freeByProduct).filter((id) => offer.freeByProduct[id] > 0);
  const claimed = options.filter((o) => claimedIds.includes(o.productId));
  const anyUnlocked = options.some((o) => o.claimableUnits > 0);
  const nextUnlock = Math.min(...options.map((o) => o.unitsToUnlock).filter((n) => n > 0), Infinity);

  const [changing, setChanging] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  // Units the shopper could claim of an option: what the cart earns, limited by stock after
  // taking back any units previously added as the reward.
  const unitsFor = (o: FreeProductOption) => {
    const paidInCart = Math.max(0, o.inCartQuantity - (rewardUnits[o.productId] ?? 0));
    const room = o.availableQuantity == null ? Infinity : o.availableQuantity - paidInCart;
    return Math.max(0, Math.min(o.claimableUnits, room));
  };

  const picking = anyUnlocked && (claimed.length === 0 || changing);
  // Highlighted by default: the best-saving option the shopper can actually claim.
  const bestId = options.find((o) => unitsFor(o) > 0)?.productId ?? null;
  const selectedId = pending && options.some((o) => o.productId === pending) ? pending : bestId;
  const selected = options.find((o) => o.productId === selectedId) ?? null;
  const visible = showAll || changing ? options : options.slice(0, SUGGESTED_COUNT);

  const confirm = () => {
    if (!selected) return;
    const units = unitsFor(selected);
    if (units < 1) return;
    claimFreeProduct(
      {
        productId: selected.productId,
        slug: selected.slug,
        name: selected.name,
        image: selected.imageUrl,
        price: selected.unitPrice,
        mrp: selected.mrp,
        maxQuantity: selected.availableQuantity ?? undefined,
      },
      units
    );
    setPending(null);
    setChanging(false);
    setShowAll(false);
  };

  const rule = `Buy ${offer.buyQuantity} eligible product${offer.buyQuantity === 1 ? "" : "s"}, get 1 free — the free item costs the same or less than the item you buy.`;

  return (
    <div className="mt-3 border-t border-brand/15 pt-3" data-testid="free-product-picker">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">Choose Your Free Product</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            anyUnlocked ? "bg-brand text-white" : "bg-white text-ink-muted ring-1 ring-border"
          }`}
        >
          {anyUnlocked ? "Offer unlocked" : "Locked"}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{rule}</p>

      {rewardNotice && (
        <p role="alert" className="mt-2 rounded-lg bg-sale/10 px-3 py-2 text-xs font-semibold text-sale">
          {rewardNotice}
        </p>
      )}

      {options.length === 0 && (
        <p aria-live="polite" className="mt-2 text-sm font-semibold text-ink">
          No free product is available for the items in your cart right now.
        </p>
      )}
      {options.length > 0 && !anyUnlocked && (
        <p aria-live="polite" className="mt-2 text-sm font-semibold text-ink">
          {Number.isFinite(nextUnlock)
            ? `Add ${nextUnlock} more eligible product${nextUnlock === 1 ? "" : "s"} to unlock your free gift.`
            : "Add eligible products to unlock your free gift."}
        </p>
      )}

      {claimed.length > 0 && !picking && (
        <>
          <ul className="mt-2 space-y-2">
            {claimed.map((o) => {
              const units = offer.freeByProduct[o.productId];
              return (
                <li key={o.productId} className="rounded-xl border-2 border-brand bg-white p-3">
                  <OptionBody option={o} selected units={units} />
                  <p className="mt-2 text-xs font-semibold text-brand">
                    Your free product · you save {rs(o.unitPrice * units)}
                  </p>
                </li>
              );
            })}
          </ul>
          {anyUnlocked && (
            <button
              type="button"
              onClick={() => {
                setChanging(true);
                setPending(null);
              }}
              className="mt-2 text-xs font-bold text-brand underline underline-offset-2"
            >
              Change Free Product
            </button>
          )}
        </>
      )}

      {options.length > 0 && (picking || !anyUnlocked) && (
        <>
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3" role="listbox" aria-label="Free product choices">
            {visible.map((o) => {
              const units = unitsFor(o);
              const locked = o.claimableUnits < 1;
              const disabled = locked || units < 1;
              const isSelected = !disabled && selectedId === o.productId;
              return (
                <li key={o.productId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={disabled}
                    onClick={() => setPending(o.productId)}
                    className={`relative w-full rounded-xl border-2 bg-white p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected ? "border-brand ring-2 ring-brand/20" : "border-border hover:border-brand/50"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2 right-2 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        {o.productId === bestId ? "Best saving" : "Selected"}
                      </span>
                    )}
                    <OptionBody option={o} selected={isSelected} />
                    {locked && o.unitsToUnlock > 0 && (
                      <p className="mt-1 text-[11px] font-semibold text-ink-muted">
                        Add {o.unitsToUnlock} more eligible product{o.unitsToUnlock === 1 ? "" : "s"} to unlock
                      </p>
                    )}
                    {!locked && units < 1 && <p className="mt-1 text-[11px] font-semibold text-sale">Not enough stock</p>}
                  </button>
                </li>
              );
            })}
          </ul>

          {!changing && !showAll && options.length > SUGGESTED_COUNT && anyUnlocked && (
            <button type="button" onClick={() => setShowAll(true)} className="mt-2 text-xs font-bold text-brand underline underline-offset-2">
              Choose Another Product
            </button>
          )}

          {anyUnlocked && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={confirm}
                disabled={!selected || unitsFor(selected) < 1 || isRefreshing}
                className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand/40"
              >
                Confirm Free Product
              </button>
              {changing && (
                <button
                  type="button"
                  onClick={() => {
                    setChanging(false);
                    setPending(null);
                  }}
                  className="text-xs font-semibold text-ink-muted"
                >
                  Cancel
                </button>
              )}
              {selected && unitsFor(selected) > 0 && (
                <span className="text-xs text-ink-muted">
                  {unitsFor(selected)} free · you save {rs(selected.unitPrice * unitsFor(selected))}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OptionBody({ option, selected, units }: { option: FreeProductOption; selected: boolean; units?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cream">
        {option.imageUrl ? (
          <Image src={resolveMediaUrl(option.imageUrl)} alt={option.name} fill sizes="56px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-ink-faint">No image</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-ink">{option.name}</p>
        {option.packSize && <p className="text-[11px] text-ink-muted">{option.packSize}</p>}
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-xs">
          <span className="font-extrabold uppercase text-brand">Free{units && units > 1 ? ` × ${units}` : ""}</span>
          <span className="text-ink-faint line-through">{rs(option.unitPrice)}</span>
        </p>
      </div>
      {selected && (
        <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
          ✓
        </span>
      )}
    </div>
  );
}
