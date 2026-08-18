import Link from "next/link";
import ProductArt from "../sections/ProductArt";
import { slugify } from "../sections/product-data";
import { IconClose } from "../ui/icons";
import type { CartItem } from "./cart-data";

export default function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const lineTotal = item.price * item.quantity;
  const href = `/products/${slugify(item.name)}`;

  return (
    <div className="flex gap-4 border-b border-border py-5 last:border-b-0 sm:gap-5">
      <Link
        href={href}
        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-24 sm:w-24"
      >
        <ProductArt accent={item.accent} count={item.artCount} />
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
              {item.variant && (
                <p className="mt-0.5 text-xs text-ink-muted">{item.variant}</p>
              )}
            </div>

            {/* Mobile-only remove button, next to the name so it doesn't
                compete for space with the quantity/total row below. */}
            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              onClick={() => onRemove(item.id)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sale/10 hover:text-sale sm:hidden"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-sm font-bold text-ink sm:hidden">
            Rs. {item.price.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-8">
          <div className="hidden w-20 text-sm font-semibold text-ink sm:block">
            Rs. {item.price.toFixed(2)}
          </div>

          <div className="flex items-center rounded-full border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
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
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              className="flex h-8 w-7 items-center justify-center text-ink-muted transition-colors hover:text-brand sm:w-8"
            >
              +
            </button>
          </div>

          <div className="w-16 text-right text-sm font-bold text-ink sm:w-20">
            {lineTotal.toFixed(2)} ₹
          </div>

          {/* Desktop-only remove button, back at the end of the row. */}
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove(item.id)}
            className="hidden h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sale/10 hover:text-sale sm:flex"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
