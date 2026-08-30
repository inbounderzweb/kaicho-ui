import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INITIAL_CART, type CartItem } from "@/app/components/cart/cart-data";

interface CartStoreState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
  getItemQuantity: (productId: string) => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: INITIAL_CART,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            const nextQuantity = existing.quantity + item.quantity;
            // maxQuantity is an informational stock snapshot, not a hard
            // guarantee — still worth capping the local cart display so it
            // doesn't silently grow past what was last known in stock. The
            // backend remains the authority: /checkout/preview and
            // /checkout both re-check real stock before an order is placed.
            const capped =
              typeof item.maxQuantity === "number" ? Math.min(nextQuantity, item.maxQuantity) : nextQuantity;
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, ...item, quantity: capped }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity < 1) return state;
          return {
            items: state.items.map((i) =>
              i.productId === productId
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
      getItemQuantity: (productId) =>
        get().items.find((i) => i.productId === productId)?.quantity ?? 0,
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
      // The cart's shape changed from the old dummy-data seed (keyed by
      // `id`, no productId/maxQuantity) to the real productId-keyed
      // CartItem — bumping the version and discarding anything that
      // doesn't look like the current shape means a browser that persisted
      // a cart under the old build won't rehydrate broken rows (missing
      // productId breaks the React key + quantity/remove handlers; a raw
      // unresolved image path 404s instead of rendering).
      version: 1,
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
        return { items: valid ? (items as CartItem[]) : [] };
      },
    }
  )
);
