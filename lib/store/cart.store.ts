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
  // BOGO free-item preference. `null` = AUTO (the server picks the best valid
  // pairing). A map = the shopper chose their free units manually (productId →
  // free quantity). It is a HINT only: the server re-validates every pick and
  // keeps any that don't qualify as paid. Never contains a price.
  freeSelections: Record<string, number> | null;
  setFreeSelection: (productId: string, quantity: number) => void;
  setFreeSelectionMode: (mode: "AUTO" | "MANUAL", seed?: Record<string, number>) => void;
  // Units the shopper added to the cart AS their free reward (productId →
  // units), so changing the choice or losing the offer takes back exactly
  // those units and never ones they bought themselves. Display bookkeeping
  // only: what is actually free is decided by the server.
  rewardUnits: Record<string, number>;
  rewardNotice: string | null;
  claimFreeProduct: (product: RewardProduct, units: number) => void;
  /** keepLine: never empty a line — its last unit stays as a normal, paid item. */
  clearFreeReward: (notice?: string | null, options?: { keepLine?: boolean }) => void;
  reconcileFreeReward: (evaluation: FreeRewardEvaluation) => void;
}

/** What the server's latest SETTLED evaluation of the current cart says about free products. */
export interface FreeRewardEvaluation {
  /** productId → free units the cart currently earns of it (only products still offered). */
  claimable: Record<string, number>;
  names: Record<string, string>;
  /** productId → free units the server actually gave (offer.freeByProduct). */
  honoured: Record<string, number>;
  /** The "Choose Your Free Product" picker is showing, so every manual pick came from it. */
  pickerActive: boolean;
}

/** What the cart needs to hold a free-reward product (display snapshot; the server re-prices). */
export interface RewardProduct {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  mrp: number;
  maxQuantity?: number;
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
      freeSelections: null,
      setFreeSelection: (productId, quantity) =>
        set((state) => {
          const next = { ...(state.freeSelections ?? {}) };
          if (quantity > 0) next[productId] = quantity;
          else delete next[productId];
          return { freeSelections: next };
        }),
      setFreeSelectionMode: (mode, seed) =>
        set({ freeSelections: mode === "AUTO" ? null : { ...(seed ?? {}) } }),
      rewardUnits: {},
      rewardNotice: null,
      claimFreeProduct: (product, units) => {
        if (units < 1) return;
        get().clearFreeReward(null);
        get().addItem({
          productId: product.productId,
          slug: product.slug,
          name: product.name,
          image: product.image,
          imageAlt: product.name,
          price: product.price,
          mrp: product.mrp,
          quantity: units,
          maxQuantity: product.maxQuantity,
        });
        set({ rewardUnits: { [product.productId]: units }, freeSelections: { [product.productId]: units } });
      },
      // Takes back the units added as a reward (and the manual free pick that
      // pointed at them). Units the shopper bought themselves stay.
      clearFreeReward: (notice = null, { keepLine = false } = {}) => {
        const { rewardUnits, items } = get();
        for (const [productId, units] of Object.entries(rewardUnits)) {
          const line = items.find((i) => cartLineKey(i) === `${productId}:UNIT`);
          if (!line) continue;
          // Changing the choice removes the old gift entirely. Cleaning up after the
          // server stopped honouring it must not delete an item the shopper may
          // consider theirs (e.g. they lowered a quantity 2 -> 1), so keep the last unit.
          const removable = keepLine ? Math.min(units, line.quantity - 1) : Math.min(units, line.quantity);
          if (removable > 0) get().decrementItem({ ...line, quantity: removable });
        }
        set((state) => {
          const picks = { ...(state.freeSelections ?? {}) };
          for (const productId of Object.keys(rewardUnits)) delete picks[productId];
          return { rewardUnits: {}, rewardNotice: notice, freeSelections: state.freeSelections ? picks : null };
        });
      },
      // Runs against a fresh, SETTLED server evaluation of the current cart and
      // makes the cart agree with it: the reward is dropped when its product is
      // no longer offered or the cart stopped qualifying, trimmed when fewer free
      // units are earned, and anything the server did not honour is cleaned up
      // instead of lingering as a stale pick (which showed as a rejection error
      // under a picker that said nothing was chosen).
      reconcileFreeReward: ({ claimable, names, honoured, pickerActive }) => {
        const { rewardUnits, items } = get();
        for (const [productId, units] of Object.entries(rewardUnits)) {
          if (units <= 0) continue;
          const line = items.find((i) => cartLineKey(i) === `${productId}:UNIT`);
          const inCart = line?.quantity ?? 0;
          const name = names[productId] ?? line?.name ?? "Your free product";
          const tracked = Math.min(units, inCart);
          if (!line || inCart === 0) {
            set((state) => {
              const { [productId]: _gone, ...rest } = state.rewardUnits;
              void _gone;
              return { rewardUnits: rest };
            });
          } else if (!(productId in claimable)) {
            get().clearFreeReward(`${name} is no longer available as a free product. Please choose another.`, { keepLine: true });
          } else if (claimable[productId] < 1 || (honoured[productId] ?? 0) < 1) {
            // Nothing free was granted for it (cart no longer qualifies, e.g. the item that
            // paid for it was removed): the unit only ever was a gift, so take it back.
            get().clearFreeReward("Your free product is no longer free because your cart no longer qualifies for the offer.", { keepLine: true });
          } else if (tracked > Math.min(claimable[productId], honoured[productId] ?? 0)) {
            const keep = Math.min(claimable[productId], honoured[productId] ?? 0);
            // keep >= 1 here, so this never empties the line.
            const removal = Math.max(0, tracked - keep);
            if (removal > 0) get().decrementItem({ ...line, quantity: removal });
            set((state) => ({
              rewardUnits: { ...state.rewardUnits, [productId]: keep },
              freeSelections: state.freeSelections ? { ...state.freeSelections, [productId]: keep } : null,
            }));
          }
        }

        // Picks the server did not (fully) honour. With the picker showing, every
        // pick was made through it, so a pick that is not granted is just stale.
        if (pickerActive) {
          set((state) => {
            if (!state.freeSelections) return state;
            const next: Record<string, number> = {};
            let changed = false;
            for (const [productId, quantity] of Object.entries(state.freeSelections)) {
              const granted = Math.min(quantity, honoured[productId] ?? 0);
              if (granted !== quantity) changed = true;
              if (granted > 0) next[productId] = granted;
            }
            return changed ? { freeSelections: next } : state;
          });
        }
      },
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
        set((state) => {
          const items = state.items.filter((i) => cartLineKey(i) !== itemKey);
          // Drop a manual free pick whose product just left the cart entirely.
          let freeSelections = state.freeSelections;
          if (freeSelections && removed && !items.some((i) => i.productId === removed.productId)) {
            freeSelections = { ...freeSelections };
            delete freeSelections[removed.productId];
          }
          return { items, freeSelections };
        });
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
      clearCart: () => set({ items: [], freeSelections: null, rewardUnits: {}, rewardNotice: null }),
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
