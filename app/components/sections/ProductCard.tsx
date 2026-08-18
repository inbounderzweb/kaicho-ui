import { IconCart, IconCheck } from "../ui/icons";
import ProductArt from "./ProductArt";
import type { Product } from "./product-data";

export default function ProductCard({ name, price, originalPrice, accent, count, tags }: Product) {
  const discount = Math.round((1 - price / originalPrice) * 100);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(28,28,28,0.25)]">
      <div className="relative aspect-square overflow-hidden bg-cream">
        <span className="absolute left-3 top-3 z-10 rounded-md bg-sale px-2 py-1 text-xs font-bold text-white">
          -{discount}%
        </span>
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <ProductArt accent={accent} count={count} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-[15px] font-semibold leading-snug text-ink sm:text-base">
          {name}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink">Rs. {price.toFixed(2)}</span>
          <span className="text-sm text-ink-faint line-through">Rs. {originalPrice.toFixed(2)}</span>
        </div>

        <button
          type="button"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark"
        >
          <IconCart className="h-4 w-4" />
          Add to Cart
        </button>

        <ul className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3.5">
          {tags.map((tag) => (
            <li key={tag} className="flex items-center gap-1 text-[11px] font-medium text-ink-muted">
              <IconCheck className="h-3 w-3 text-brand" />
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
