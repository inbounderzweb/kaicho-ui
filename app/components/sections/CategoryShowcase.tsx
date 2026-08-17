import Image from "next/image";
import Container from "../ui/Container";
import { IconCart, IconHeart } from "../ui/icons";
import ProductArt from "./ProductArt";
import { COMBOS, MEALS, SAVER_PACKS } from "./product-data";
import type { Product } from "./product-data";

const CATEGORIES: { label: string; products: Product[] }[] = [
  { label: "Ready to Eat Meals", products: MEALS },
  { label: "Combos & Bundles", products: COMBOS },
  { label: "Family Saver Packs", products: SAVER_PACKS },
];

function CategoryCard({ name, price, originalPrice, accent, count, image, tags }: Product) {
  const discount = Math.round((1 - price / originalPrice) * 100);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(28,28,28,0.25)]">
      <div className="relative aspect-square bg-cream p-5">
        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-sale px-2 py-1 text-[11px] font-bold text-white">
            -{discount}%
          </span>
        )}
        <button
          type="button"
          aria-label={`Add ${name} to wishlist`}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink-muted shadow-sm transition hover:bg-brand-soft hover:text-brand"
        >
          <IconHeart className="h-4 w-4" />
        </button>
        <div className="relative h-full w-full transition-transform duration-500 group-hover:scale-105">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-contain"
            />
          ) : (
            <ProductArt accent={accent} count={count} />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {tags[0] && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
            {tags[0]}
          </span>
        )}

        <h4 className="mt-1 font-display text-[15px] font-semibold leading-snug text-ink sm:text-base">
          {name}
        </h4>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold text-ink">Rs. {price.toFixed(2)}</span>
          <span className="text-sm text-ink-faint line-through">Rs. {originalPrice.toFixed(2)}</span>
          {discount > 0 && (
            <span className="text-xs font-semibold text-brand">
              Save {discount}%
            </span>
          )}
        </div>

        <button
          type="button"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark"
        >
          <IconCart className="h-4 w-4" />
          Add Cart
        </button>
      </div>
    </div>
  );
}

export default function CategoryShowcase() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-terracotta">Full Menu</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-black sm:text-4xl">
              Shop by Category
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-black/50">
            Every Kaicho meal, combo, and saver pack — ready to eat, wherever you are.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-16 sm:mt-16">
          {CATEGORIES.map(({ label, products }) => (
            <div key={label}>
              <div className="flex items-center gap-4">
                <h3 className="shrink-0 font-display text-xl font-bold text-black sm:text-2xl">
                  {label}
                </h3>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="no-scrollbar mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 sm:snap-none lg:grid-cols-4">
                {products.map((product) => (
                  <div key={product.name} className="w-[68vw] max-w-65 shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink">
                    <CategoryCard {...product} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
