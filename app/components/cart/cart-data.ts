import { COMBOS, MEALS } from "../sections/product-data";

export const FREE_SHIPPING_THRESHOLD = 499;
export const CASHBACK_THRESHOLD = 999;
export const CASHBACK_PERCENT = 3;

export type CartItem = {
  id: string;
  name: string;
  variant?: string;
  price: number;
  accent: string;
  artCount: 1 | 2 | 3;
  quantity: number;
};

export const INITIAL_CART: CartItem[] = [
  {
    id: "veg-oats-porridge",
    name: MEALS[2].name,
    variant: "Single Pack",
    price: MEALS[2].price,
    accent: MEALS[2].accent,
    artCount: MEALS[2].count,
    quantity: 2,
  },
  {
    id: "chicken-oats-porridge",
    name: MEALS[3].name,
    variant: "Single Pack",
    price: MEALS[3].price,
    accent: MEALS[3].accent,
    artCount: MEALS[3].count,
    quantity: 1,
  },
  {
    id: "millet-duo-combo",
    name: COMBOS[0].name,
    variant: "2-Pack Combo",
    price: COMBOS[0].price,
    accent: COMBOS[0].accent,
    artCount: COMBOS[0].count,
    quantity: 1,
  },
];
