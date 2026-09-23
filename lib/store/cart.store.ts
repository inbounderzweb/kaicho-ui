import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INITIAL_CART, cartLineKey, type CartItem, type CartPackBreakdownLine } from "@/app/components/cart/cart-data";
import { trackEvent } from "@/lib/analytics/events";
import { toEcommerceItem } from "@/lib/analytics/ecommerce";

interface CartStoreState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  decrementItem: (item: CartItem) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
  getItemQuantity: (productId: string) => number;
}

// A pack line and a plain unit line for the same product are two distinct
// rows (spec §14) — merges only combine two lines that resolve to the exact
// same cartLineKey. For a pack+pack merge, pack counts are summed per pack
// id rather than the two breakdowns just sitting side by side.
function mergePackBreakdown(
  existing: CartPackBreakdownLine[] | undefined,
  incoming: CartPackBreakdownLine[] | undefined
): CartPackBreakdownLine[] | undefined {
  if (!existing?.length && !incoming?.length) return undefined;
  const byPackId = new Map<string, CartPackBreakdownLine>();
  for (const line of existing ?? []) byPackId.set(line.packId, { ...line });
  for (const line of incoming ?? []) {
    const prev = byPackId.get(line.packId);
    byPackId.set(line.packId, prev ? { ...prev, packCount: prev.packCount + line.packCount } : { ...line });
  }
  return [...byPackId.values()];
}

// Inverse of mergePackBreakdown: takes one selection's pack counts back out.
// A pack id that drops to zero leaves the breakdown entirely rather than
// lingering as a "× 0" line.
function subtractPackBreakdown(
  existing: CartPackBreakdownLine[] | undefined,
  incoming: CartPackBreakdownLine[] | undefined
): CartPackBreakdownLine[] | undefined {
  if (!existing?.length) return undefined;
  if (!incoming?.length) return existing;
  const byPackId = new Map(existing.map((line) => [line.packId, { ...line }]));
  for (const line of incoming) {
    const prev = byPackId.get(line.packId);
    if (!prev) continue;
    const nextCount = prev.packCount - line.packCount;
    if (nextCount > 0) byPackId.set(line.packId, { ...prev, packCount: nextCount });
    else byPackId.delete(line.packId);
  }
  const next = [...byPackId.values()];
  return next.length ? next : undefined;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: INITIAL_CART,
      addItem: (item) => {
        set((state) => {
          const key = cartLineKey(item);
          const existing = state.items.find((i) => cartLineKey(i) === key);
          if (existing) {
            const nextQuantity = existing.quantity + item.quantity;
            // maxQuantity is an informational stock snapshot, not a hard
            // guarantee — still worth capping the local cart display so it
            // doesn't silently grow past what was last known in stock. The
            // backend remains the authority: /checkout/preview and
            // /checkout both re-check real stock before an order is placed.
            const capped =
              item.selectionType !== "PACK" && typeof item.maxQuantity === "number" ? Math.min(nextQuantity, item.maxQuantity) : nextQuantity;
            return {
              items: state.items.map((i) =>
                cartLineKey(i) === key
                  ? { ...i, ...item, quantity: capped, packBreakdown: mergePackBreakdown(i.packBreakdown, item.packBreakdown) }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
        // Tracks the quantity/value of THIS add action, not the resulting
        // cart total — the standard GA4 add_to_cart convention, and every
        // "Add to cart" button in the app (detail page, product card)
        // routes through here, so this is the one place it needs to fire.
        trackEvent("add_to_cart", {
          currency: "INR",
          value: item.price * item.quantity,
          items: [
            toEcommerceItem({
              id: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }),
          ],
        });
      },
      // Exact inverse of addItem: takes ONE of that selection back out of the
      // line it merged into. Symmetry is what makes it correct for packs too
      // — a pack's `quantity` is base units, so the only coherent way to step
      // it down is by the same selection that stepped it up (one whole
      // "Combo of 3" = 3 units + that pack's counts), never by a raw unit.
      // Note cartLineKey normalizes pack counts by their ratio, so the line's
      // identity survives the decrement.
      decrementItem: (item) => {
        const key = cartLineKey(item);
        const existing = get().items.find((i) => cartLineKey(i) === key);
        if (!existing) return;
        if (existing.quantity - item.quantity < 1) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            cartLineKey(i) === key
              ? {
                  ...i,
                  quantity: i.quantity - item.quantity,
                  packBreakdown: subtractPackBreakdown(i.packBreakdown, item.packBreakdown),
                }
              : i
          ),
        }));
        // Mirrors addItem's add_to_cart: reports THIS removal, not the
        // resulting line.
        trackEvent("remove_from_cart", {
          currency: "INR",
          value: item.price * item.quantity,
          items: [
            toEcommerceItem({
              id: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            }),
          ],
        });
      },
      removeItem: (itemKey) => {
        const removed = get().items.find((i) => cartLineKey(i) === itemKey);
        set((state) => ({ items: state.items.filter((i) => cartLineKey(i) !== itemKey) }));
        if (removed) {
          trackEvent("remove_from_cart", {
            currency: "INR",
            value: removed.price * removed.quantity,
            items: [
              toEcommerceItem({
                id: removed.productId,
                name: removed.name,
                price: removed.price,
                quantity: removed.quantity,
              }),
            ],
          });
        }
      },
      updateQuantity: (itemKey, quantity) =>
        set((state) => {
          if (quantity < 1) return state;
          return {
            items: state.items.map((i) =>
              cartLineKey(i) === itemKey
                ? { ...i, quantity: typeof i.maxQuantity === "number" ? Math.min(quantity, i.maxQuantity) : quantity }
                : i
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
      // Total units of this product across every line (a plain line plus any
      // pack lines) — a pack-aware caller wanting one specific line's
      // quantity should read `items` directly and key on cartLineKey.
      getItemQuantity: (productId) =>
        get().items.filter((i) => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "kaicho-cart",
      // Server has no localStorage, so it always renders INITIAL_CART. If the
      // client read localStorage synchronously on store creation (the
      // default), its first render could already differ from the
      // server-rendered HTML and React would throw a hydration mismatch.
      // Skipping auto-hydration keeps the first client render identical to
      // the server, then Providers triggers the real rehydrate() post-mount.
      skipHydration: true,
      // Version 3 consolidates proportional pack rows into stable identities.
      // Version 2: cart identity moved from productId alone to
      // productId+pack-signature (cartLineKey) so a pack line and a unit
      // line for the same product can coexist (spec §14). A cart persisted
      // under version 1 has no packBreakdown/selectionType fields at all,
      // so it migrates forward as-is — every existing row already resolves
      // to the "UNIT" cartLineKey, meaning old carts keep working exactly
      // as before with no data loss.
      version: 3,
      migrate: (persisted) => {
        const state = persisted as { items?: unknown } | undefined;
        const items = Array.isArray(state?.items) ? state.items : [];
        const valid = items.every(
          (i): i is CartItem =>
            typeof i === "object" &&
            i !== null &&
            typeof (i as CartItem).productId === "string" &&
            typeof (i as CartItem).price === "number"
        );
        if (!valid) return { items: [] };
        const merged = new Map<string, CartItem>();
        for (const item of items as CartItem[]) {
          const key = cartLineKey(item);
          const previous = merged.get(key);
          merged.set(key, previous ? {
            ...item, quantity: previous.quantity + item.quantity,
            price: (previous.price * previous.quantity + item.price * item.quantity) / (previous.quantity + item.quantity),
            packBreakdown: mergePackBreakdown(previous.packBreakdown, item.packBreakdown),
          } : item);
        }
        return { items: [...merged.values()] };
      },
    }
  )
);
