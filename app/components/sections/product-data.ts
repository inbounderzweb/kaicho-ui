export type Product = {
  name: string;
  price: number;
  originalPrice: number;
  accent: string;
  count: 1 | 2 | 3;
  tags: string[];
};

const GREEN = "#00A861";
const TERRACOTTA = "#C97B4A";
const OLIVE = "#8A6D3B";
const GOLD = "#C9A24A";

export const MEALS: Product[] = [
  { name: "Mixed Millet Porridge", price: 140, originalPrice: 190, accent: OLIVE, count: 1, tags: ["100% Natural", "No Preservatives"] },
  { name: "Navadhanya Porridge", price: 140, originalPrice: 190, accent: GOLD, count: 1, tags: ["100% Natural", "No Preservatives"] },
  { name: "Veg Oats Porridge", price: 180, originalPrice: 220, accent: GREEN, count: 1, tags: ["100% Natural", "No Preservatives"] },
  { name: "Chicken Oats Porridge", price: 190, originalPrice: 230, accent: TERRACOTTA, count: 1, tags: ["100% Natural", "No Preservatives"] },
];

export const COMBOS: Product[] = [
  { name: "Kaicho Ready-to-Eat Millet Duo", price: 280, originalPrice: 380, accent: OLIVE, count: 2, tags: ["100% Natural", "No Preservatives"] },
  { name: "Complete Ready-to-Eat Meal Bundle", price: 680, originalPrice: 830, accent: GREEN, count: 3, tags: ["100% Natural", "No Preservatives"] },
  { name: "Kaicho Vegetarian Power Pack", price: 500, originalPrice: 600, accent: GREEN, count: 3, tags: ["100% Natural", "No Preservatives"] },
  { name: "Kaicho Veg & Chicken Oats Combo", price: 370, originalPrice: 450, accent: TERRACOTTA, count: 2, tags: ["100% Natural", "No Preservatives"] },
];

export const SAVER_PACKS: Product[] = [
  { name: "Veg Oats Bulk Pack (10 Packs)", price: 1750, originalPrice: 2200, accent: GREEN, count: 3, tags: ["100% Natural", "No Preservatives"] },
  { name: "Chicken Oats Bulk Pack (10 Packs)", price: 1800, originalPrice: 2300, accent: TERRACOTTA, count: 3, tags: ["100% Natural", "No Preservatives"] },
  { name: "Mixed Millet Bulk Pack (10 Packs)", price: 1500, originalPrice: 1900, accent: OLIVE, count: 3, tags: ["100% Natural", "No Preservatives"] },
  { name: "Navadhanya Bulk Pack (10 Packs)", price: 1350, originalPrice: 1875, accent: GOLD, count: 3, tags: ["100% Natural", "No Preservatives"] },
];
