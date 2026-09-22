import Link from "next/link";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/api/client";
import { IconClose } from "../ui/icons";
import type { CartItem } from "./cart-data";

export default function CartItemRow({
  item,
  itemKey,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  itemKey: string;
  onQuantityChange: (itemKey: string, quantity: number) => void;
  onRemove: (itemKey: string) => void;
}) {
  const lineTotal = item.price * item.quantity;
  const href = `/products/${item.slug}`;
  const atMax = typeof item.maxQuantity === "number" && item.quantity >= item.maxQuantity;
  // A pack is a fixed bundle — "quantity +/- 1" is meaningless on it. Pack
  // rows show the confirmed breakdown as read-only text and only offer
  // Remove / a link back to the product page to pick a different pack,
  // rather than an arbitrary unit stepper (spec §13/§14).
  const isPack = item.selectionType === "PACK" && (item.packBreakdown?.length ?? 0) > 0;

  return (
    <div className="flex gap-4 border-b border-border py-5 last:border-b-0 sm:gap-5">
      <Link
        href={href}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-24 sm:w-24"
      >
        {item.image ? (
          <Image
            // item.image is stored already-resolved (see cart-data.ts).
            // This defensive re-resolve covers a cart persisted by an
            // older build whose absolute URL points at a stale backend
            // origin — resolveMediaUrl reduces any "/uploads/" URL back to
            // a root-relative path, which next.config.ts's rewrite proxies
            // to the backend.
            src={resolveMediaUrl(item.image)}
            alt={item.imageAlt}
            fill
            sizes="(min-width: 640px) 96px, 80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-ink-faint">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href={href}>
                <h3 className="line-clamp-2 break-words font-display text-sm font-semibold leading-snug text-ink hover:text-brand sm:text-base">
                  {item.name}
                </h3>
              </Link>
              {isPack && (
                <p className="mt-0.5 text-xs font-medium text-ink-muted">
                  {item.packBreakdown!.map((l) => `${l.packName} × ${l.packCount}`).join(" + ")}
                </p>
              )}
            </div>

            {/* Mobile-only remove button, next to the name so it doesn't
                compete for space with the quantity/total row below. */}
            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              onClick={() => onRemove(itemKey)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sale/10 hover:text-sale sm:hidden"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-sm font-bold text-ink sm:hidden">
            Rs. {item.price.toFixed(2)}
          </p>
          {atMax && !isPack && (
            <p className="mt-1 text-xs font-semibold text-sale sm:hidden">
              Only {item.maxQuantity} left in stock
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-8">
          <div className="hidden w-20 text-sm font-semibold text-ink sm:block">
            Rs. {item.price.toFixed(2)}
          </div>

          {isPack ? (
            <div className="flex flex-col items-center gap-1">
              <span className="flex h-8 min-w-22 items-center justify-center rounded-full border border-border px-3 text-sm font-semibold text-ink">
                {item.quantity} units
              </span>
              <Link
                href={href}
                className="text-[11px] font-semibold text-brand transition-colors hover:text-brand-dark"
              >
                Change pack
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center rounded-full border border-border">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => onQuantityChange(itemKey, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="flex h-8 w-7 items-center justify-center text-ink-muted transition-colors hover:text-brand disabled:opacity-30 sm:w-8"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-semibold text-ink sm:w-6">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => onQuantityChange(itemKey, item.quantity + 1)}
                  disabled={atMax}
                  className="flex h-8 w-7 items-center justify-center text-ink-muted transition-colors hover:text-brand disabled:opacity-30 sm:w-8"
                >
                  +
                </button>
              </div>
              {atMax && (
                <p className="hidden text-[11px] font-semibold text-sale sm:block">
                  Only {item.maxQuantity} left
                </p>
              )}
            </div>
          )}

          <div className="w-16 text-right text-sm font-bold text-ink sm:w-20">
            {lineTotal.toFixed(2)} ₹
          </div>

          {/* Desktop-only remove button, back at the end of the row. */}
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove(itemKey)}
            className="hidden h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sale/10 hover:text-sale sm:flex"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
