import { COMBOS, MEALS, SAVER_PACKS } from "../sections/product-data";

export const USER = {
  name: "Rohan Sharma",
  phone: "+91 98765 43210",
};

export type OrderStatus = "On the way" | "Delivered" | "Cancelled" | "Processing";

export type OrderItem = {
  name: string;
  variant?: string;
  quantity: number;
  price: number;
  accent: string;
  artCount: 1 | 2 | 3;
};

export type Order = {
  id: string;
  placedOn: string;
  status: OrderStatus;
  deliveryDate: string;
  deliveredTo: string;
  total: number;
  paid: boolean;
  items: OrderItem[];
};

export const ORDERS: Order[] = [
  {
    id: "KC73262",
    placedOn: "13:45, 10 Aug 2026",
    status: "On the way",
    deliveryDate: "Fri, 21 Aug 2026",
    deliveredTo: "12 MG Road, Bengaluru, KA 560001",
    total: MEALS[2].price * 2 + COMBOS[0].price,
    paid: true,
    items: [
      {
        name: MEALS[2].name,
        variant: "Single Pack",
        quantity: 2,
        price: MEALS[2].price,
        accent: MEALS[2].accent,
        artCount: MEALS[2].count,
      },
      {
        name: COMBOS[0].name,
        variant: "2-Pack Combo",
        quantity: 1,
        price: COMBOS[0].price,
        accent: COMBOS[0].accent,
        artCount: COMBOS[0].count,
      },
    ],
  },
  {
    id: "KC71190",
    placedOn: "10:12, 2 Aug 2026",
    status: "Delivered",
    deliveryDate: "Wed, 5 Aug 2026",
    deliveredTo: "12 MG Road, Bengaluru, KA 560001",
    total: SAVER_PACKS[0].price,
    paid: true,
    items: [
      {
        name: SAVER_PACKS[0].name,
        variant: "Bulk Pack",
        quantity: 1,
        price: SAVER_PACKS[0].price,
        accent: SAVER_PACKS[0].accent,
        artCount: SAVER_PACKS[0].count,
      },
    ],
  },
  {
    id: "KC69804",
    placedOn: "18:30, 22 Jul 2026",
    status: "Cancelled",
    deliveryDate: "—",
    deliveredTo: "12 MG Road, Bengaluru, KA 560001",
    total: MEALS[3].price,
    paid: false,
    items: [
      {
        name: MEALS[3].name,
        variant: "Single Pack",
        quantity: 1,
        price: MEALS[3].price,
        accent: MEALS[3].accent,
        artCount: MEALS[3].count,
      },
    ],
  },
];

export type Address = {
  id: string;
  label: string;
  name: string;
  line: string;
  phone: string;
  isDefault: boolean;
};

export const ADDRESSES: Address[] = [
  {
    id: "home",
    label: "Home",
    name: "Rohan Sharma",
    line: "12 MG Road, Bengaluru, Karnataka 560001",
    phone: "+91 98765 43210",
    isDefault: true,
  },
  {
    id: "work",
    label: "Work",
    name: "Rohan Sharma",
    line: "WeWork Galaxy, Residency Road, Bengaluru, Karnataka 560025",
    phone: "+91 98765 43210",
    isDefault: false,
  },
];
