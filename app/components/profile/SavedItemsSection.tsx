import ProductCard from "../sections/ProductCard";
import { COMBOS, MEALS } from "../sections/product-data";

const SAVED_ITEMS = [MEALS[2], MEALS[3], COMBOS[0], COMBOS[2]];

export default function SavedItemsSection() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
      {SAVED_ITEMS.map((product) => (
        <ProductCard key={product.name} {...product} />
      ))}
    </div>
  );
}
