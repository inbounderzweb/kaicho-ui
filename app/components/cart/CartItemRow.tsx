import ProductArt from "../sections/ProductArt";
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

  return (
    <div className="flex gap-4 border-b border-border py-5 last:border-b-0 sm:gap-5">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream p-2 sm:h-24 sm:w-24">
        <ProductArt accent={item.accent} count={item.artCount} />
      </div>

      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-semibold text-ink sm:text-base">
            {item.name}
          </h3>
          {item.variant && (
            <p className="mt-0.5 text-xs text-ink-muted">{item.variant}</p>
          )}
          <p className="mt-1 text-sm font-bold text-ink sm:hidden">
            Rs. {item.price.toFixed(2)}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-8">
          <div className="hidden w-20 text-sm font-semibold text-ink sm:block">
            Rs. {item.price.toFixed(2)}
          </div>

          <div className="flex items-center rounded-full border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center text-ink-muted transition-colors hover:text-brand disabled:opacity-30"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-semibold text-ink">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-ink-muted transition-colors hover:text-brand"
            >
              +
            </button>
          </div>

          <div className="w-20 text-right text-sm font-bold text-ink">
            Rs. {lineTotal.toFixed(2)}
          </div>

          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={() => onRemove(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-sale/10 hover:text-sale"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
