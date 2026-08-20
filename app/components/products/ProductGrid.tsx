import ProductCard from "./ProductCard";
import { IconSearch } from "../ui/icons";
import type { PublicProductListItem } from "@/lib/api/publicProducts";

// Shared grid + loading/empty state — used by /products, /category/:slug,
// and anywhere else a server-paginated product list is rendered. Loading
// and empty states are handled here so every page that lists products
// gets the same skeleton/empty UX for free.
export default function ProductGrid({
  items,
  isLoading,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your search or filters.",
}: {
  items: PublicProductListItem[];
  isLoading: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-border bg-white">
            <div className="aspect-square w-full bg-cream" />
            <div className="space-y-2 p-3 sm:p-4">
              <div className="h-3 w-1/2 rounded bg-cream" />
              <div className="h-4 w-3/4 rounded bg-cream" />
              <div className="h-4 w-1/3 rounded bg-cream" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center"
      >
        <IconSearch className="h-10 w-10 text-ink-faint" />
        <p className="mt-4 text-base font-semibold text-ink">{emptyTitle}</p>
        <p className="mt-1 max-w-xs text-sm text-ink-muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
      {items.map((product, i) => (
        <ProductCard key={product.productId} product={product} priority={i < 4} />
      ))}
    </div>
  );
}
