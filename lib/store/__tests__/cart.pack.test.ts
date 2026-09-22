import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/analytics/events", () => ({ trackEvent: vi.fn() }));
import { useCartStore } from "../cart.store";
import { cartLineKey, type CartItem } from "@/app/components/cart/cart-data";
const selection = (count: number): CartItem => ({ productId: "product", name: "Porridge", slug: "porridge", image: null, imageAlt: "", mrp: 140, price: 120, quantity: 5 * count, selectionType: "PACK", packBreakdown: [{ packId: "five", packName: "Five", packQuantity: 5, packCount: count, packPrice: 600 }] });
beforeEach(() => useCartStore.setState({ items: [] }));
describe("pack cart identity", () => {
  it("merges repeated pack additions without changing the row identity", () => {
    const key = cartLineKey(selection(1));
    for (let i = 0; i < 4; i++) useCartStore.getState().addItem(selection(1));
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(20);
    expect(items[0].packBreakdown?.[0].packCount).toBe(4);
    expect(cartLineKey(items[0])).toBe(key);
    expect(useCartStore.getState().getSubtotal()).toBe(2400);
  });
  it("keeps unit lines and different pack mixes separate", () => {
    const base = selection(1);
    useCartStore.getState().addItem(base);
    useCartStore.getState().addItem({ ...base, selectionType: "UNIT", packBreakdown: undefined, quantity: 1 });
    const mixed = { ...base, quantity: 15, packBreakdown: [...base.packBreakdown!, { packId: "ten", packName: "Ten", packQuantity: 10, packCount: 1, packPrice: 1000 }] };
    useCartStore.getState().addItem(mixed);
    expect(useCartStore.getState().items).toHaveLength(3);
    expect(new Set(useCartStore.getState().items.map(cartLineKey)).size).toBe(3);
  });
  it("does not truncate pack units while retaining full pack counts", () => {
    useCartStore.getState().addItem({ ...selection(1), maxQuantity: 6 });
    useCartStore.getState().addItem({ ...selection(1), maxQuantity: 6 });
    expect(useCartStore.getState().items[0].quantity).toBe(10);
  });
});
