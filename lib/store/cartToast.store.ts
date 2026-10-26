import { create } from "zustand";

// Transient "added to cart" confirmation. Not persisted. `id` changes on every
// add so repeated adds of the same product restart the toast's timer.
interface CartToastState {
  id: number;
  message: string | null;
  show: (name: string) => void;
  hide: () => void;
}

export const useCartToastStore = create<CartToastState>((set) => ({
  id: 0,
  message: null,
  show: (name) => set((s) => ({ id: s.id + 1, message: name })),
  hide: () => set({ message: null }),
}));
