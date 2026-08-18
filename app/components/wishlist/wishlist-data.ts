import { COMBOS, MEALS, SAVER_PACKS } from "../sections/product-data";
import type { Product } from "../sections/product-data";

export type WishlistProduct = Product & { id: string };

function toId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export const ALL_PRODUCTS: WishlistProduct[] = [...MEALS, ...COMBOS, ...SAVER_PACKS].map(
  (product) => ({ ...product, id: toId(product.name) })
);

export const INITIAL_WISHLIST_IDS = [toId(MEALS[2].name), toId(COMBOS[0].name)];
