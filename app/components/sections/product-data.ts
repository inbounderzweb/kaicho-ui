export type Product = {
  name: string;
  price: number;
  originalPrice: number;
  accent: string;
  count: 1 | 2 | 3;
  tags: string[];
  image?: string;
};

const GREEN = "#00A861";
const TERRACOTTA = "#C97B4A";
const OLIVE = "#8A6D3B";
const GOLD = "#C9A24A";

const DUMMY_IMAGE = "https://kaicho.in/cdn/shop/files/BULK_COMBOS-14_1296x.jpg?v=1779259724";

export const MEALS: Product[] = [
  { name: "Mixed Millet Porridge", price: 140, originalPrice: 190, accent: OLIVE, count: 1, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
  { name: "Navadhanya Porridge", price: 140, originalPrice: 190, accent: GOLD, count: 1, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
  { name: "Veg Oats Porridge", price: 180, originalPrice: 220, accent: GREEN, count: 1, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
  { name: "Chicken Oats Porridge", price: 190, originalPrice: 230, accent: TERRACOTTA, count: 1, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
];

export const COMBOS: Product[] = [
  { name: "Kaicho Ready-to-Eat Millet Duo", price: 280, originalPrice: 380, accent: OLIVE, count: 2, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
  { name: "Complete Ready-to-Eat Meal Bundle", price: 680, originalPrice: 830, accent: GREEN, count: 3, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
  { name: "Kaicho Vegetarian Power Pack", price: 500, originalPrice: 600, accent: GREEN, count: 3, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
  { name: "Kaicho Veg & Chicken Oats Combo", price: 370, originalPrice: 450, accent: TERRACOTTA, count: 2, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
];

export const SAVER_PACKS: Product[] = [
  { name: "Veg Oats Bulk Pack (10 Packs)", price: 1750, originalPrice: 2200, accent: GREEN, count: 3, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
  { name: "Chicken Oats Bulk Pack (10 Packs)", price: 1800, originalPrice: 2300, accent: TERRACOTTA, count: 3, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
  { name: "Mixed Millet Bulk Pack (10 Packs)", price: 1500, originalPrice: 1900, accent: OLIVE, count: 3, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
  { name: "Navadhanya Bulk Pack (10 Packs)", price: 1350, originalPrice: 1875, accent: GOLD, count: 3, tags: ["100% Natural", "No Preservatives"], image: DUMMY_IMAGE },
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type SluggedProduct = Product & { slug: string };

export const ALL_PRODUCTS: SluggedProduct[] = [...MEALS, ...COMBOS, ...SAVER_PACKS].map(
  (product) => ({ ...product, slug: slugify(product.name) })
);

export function getProductBySlug(slug: string): SluggedProduct | undefined {
  return ALL_PRODUCTS.find((product) => product.slug === slug);
}
