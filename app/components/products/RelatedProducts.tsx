import ProductCard from "./ProductCard";
import type { PublicProductListItem } from "@/lib/api/publicProducts";

// Same-category-first, brand-backfilled list from getRelatedProducts() on
// the backend (see product.service.ts) — this component just renders
// whatever it's given, no client-side "similar product" heuristics.
export default function RelatedProducts({ products }: { products: PublicProductListItem[] }) {
  if (products.length === 0) return null;

  return (
    <div className="mt-16 sm:mt-20">
      <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">You Might Also Like</h2>

      {/* pr-[...] leaves trailing space equal to one card's own width
          (min(42vw,10rem) — same formula the card uses below), so the last
          card's snap-start point is actually reachable at max scrollLeft.
          Without it, snap-mandatory has no valid point to settle on near the
          end and the carousel feels like it gets stuck instead of reaching
          the last card. Reset on sm: since that breakpoint is a static grid. */}
      <div className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pr-[calc(100%-min(42vw,10rem))] sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 sm:pr-0 sm:snap-none lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.productId}
            className="w-[42vw] max-w-40 shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
