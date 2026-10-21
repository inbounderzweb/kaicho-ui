import { beforeEach, describe, expect, it, vi } from "vitest";

// Analytics is a side channel — keep it out of the cart logic under test.
vi.mock("@/lib/analytics/events", () => ({ trackEvent: vi.fn() }));

import { useCartStore } from "../cart.store";
import { cartLineKey, type CartItem } from "@/app/components/cart/cart-data";

const unit = (productId: string, quantity = 1, extra: Partial<CartItem> = {}): CartItem => ({
  productId,
  slug: productId,
  name: `Product ${productId}`,
  image: null,
  imageAlt: productId,
  price: 100,
  mrp: 120,
  quantity,
  ...extra,
});

const pack = (productId: string, packId: string, packCount: number, quantity: number): CartItem =>
  unit(productId, quantity, {
    selectionType: "PACK",
    packBreakdown: [{ packId, packName: `Pack ${packId}`, packQuantity: quantity / packCount, packCount, packPrice: 400 }],
  });

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("cart store — adding", () => {
  it("increments the existing line instead of creating a duplicate", () => {
    const { addItem } = useCartStore.getState();
    addItem(unit("a"));
    addItem(unit("a"));
    addItem(unit("a", 3));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  it("keeps different products as separate lines", () => {
    const { addItem } = useCartStore.getState();
    addItem(unit("a"));
    addItem(unit("b"));
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["a", "b"]);
  });

  it("keeps a plain unit line and a pack line of the same product apart, and merges repeat packs", () => {
    const { addItem } = useCartStore.getState();
    addItem(unit("a", 2));
    addItem(pack("a", "p5", 1, 5));
    addItem(pack("a", "p5", 1, 5));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
    expect(items.find((i) => cartLineKey(i) === "a:UNIT")!.quantity).toBe(2);
    const packLine = items.find((i) => i.selectionType === "PACK")!;
    expect(packLine.quantity).toBe(10);
    expect(packLine.packBreakdown![0].packCount).toBe(2);
  });

  it("never grows a unit line past the last known stock", () => {
    const { addItem } = useCartStore.getState();
    addItem(unit("a", 2, { maxQuantity: 3 }));
    addItem(unit("a", 5, { maxQuantity: 3 }));
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it("only re-creates the line that changed, so other cards' subscriptions stay quiet", () => {
    const { addItem } = useCartStore.getState();
    addItem(unit("a"));
    addItem(unit("b"));
    const before = useCartStore.getState().items;
    addItem(unit("b"));
    const after = useCartStore.getState().items;
    expect(after[0]).toBe(before[0]); // untouched line keeps its identity
    expect(after[1]).not.toBe(before[1]);
  });
});

describe("cart store — removing and totals", () => {
  it("steps a line down and drops it at zero", () => {
    const { addItem, decrementItem } = useCartStore.getState();
    addItem(unit("a", 2));
    decrementItem(unit("a", 1));
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    decrementItem(unit("a", 1));
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("ignores a decrement for something that isn't in the cart", () => {
    useCartStore.getState().decrementItem(unit("ghost"));
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("computes the badge count and subtotal from the lines", () => {
    const { addItem, getTotalItems, getSubtotal } = useCartStore.getState();
    addItem(unit("a", 2));
    addItem(unit("b", 3, { price: 50 }));
    expect(getTotalItems()).toBe(5);
    expect(getSubtotal()).toBe(2 * 100 + 3 * 50);
  });

  it("handles a burst of rapid adds without losing any", () => {
    const { addItem } = useCartStore.getState();
    for (let i = 0; i < 50; i++) addItem(unit("a"));
    expect(useCartStore.getState().items[0].quantity).toBe(50);
  });
});

describe("cart store — BOGO free-item preference", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], freeSelections: null });
  });

  it("starts in AUTO (null) and switches to MANUAL with a seed", () => {
    expect(useCartStore.getState().freeSelections).toBeNull();
    useCartStore.getState().setFreeSelectionMode("MANUAL", { a: 1 });
    expect(useCartStore.getState().freeSelections).toEqual({ a: 1 });
    useCartStore.getState().setFreeSelectionMode("AUTO");
    expect(useCartStore.getState().freeSelections).toBeNull();
  });

  it("setFreeSelection adds, updates and clears (0) a pick", () => {
    const { setFreeSelectionMode, setFreeSelection } = useCartStore.getState();
    setFreeSelectionMode("MANUAL");
    setFreeSelection("a", 2);
    expect(useCartStore.getState().freeSelections).toEqual({ a: 2 });
    setFreeSelection("a", 0);
    expect(useCartStore.getState().freeSelections).toEqual({});
  });

  it("removing a product from the cart drops its manual pick", () => {
    const { addItem, setFreeSelectionMode, setFreeSelection, removeItem } = useCartStore.getState();
    addItem(unit("a", 2));
    addItem(unit("b", 1));
    setFreeSelectionMode("MANUAL");
    setFreeSelection("a", 1);
    setFreeSelection("b", 1);
    removeItem(cartLineKey(unit("a")));
    expect(useCartStore.getState().freeSelections).toEqual({ b: 1 });
  });

  it("clearing the cart resets the preference to AUTO", () => {
    useCartStore.getState().setFreeSelectionMode("MANUAL", { a: 1 });
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().freeSelections).toBeNull();
  });

  it("never stores a price — the preference is productId → quantity only", () => {
    useCartStore.getState().setFreeSelection("a", 1);
    expect(Object.values(useCartStore.getState().freeSelections ?? {}).every((v) => Number.isInteger(v))).toBe(true);
  });
});
