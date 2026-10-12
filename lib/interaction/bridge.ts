import type { StandardEvent } from "../analytics/types";
import { recordInteraction } from "./tracker";

// Forwards the app's existing analytics events (already fired from every
// product page and cart action) into the private interaction
// tracker, so those call sites needed no changes. Independent of the GTM
// consent gate: whether a visitor is tracked here is decided only by the
// account-level opt-in (see tracker.setTrackingEnabled).
//
// Deliberately NOT forwarded: wishlist changes, checkout and purchase - the
// server records those at the point it knows they happened.

const SEARCH_SETTLE_MS = 1500;
let searchTimer: ReturnType<typeof setTimeout> | null = null;

function firstItem(params: { items?: { item_id: string; quantity?: number }[] }) {
  return params.items?.[0];
}

export function forwardAnalyticsEvent(event: StandardEvent) {
  try {
    switch (event.name) {
      case "view_item": {
        const item = firstItem(event.params);
        if (item) recordInteraction({ type: "product_view", productId: item.item_id });
        return;
      }
      case "add_to_cart":
      case "remove_from_cart": {
        const item = firstItem(event.params);
        if (!item) return;
        const quantity = Math.min(1000, Math.max(1, Math.round(item.quantity ?? 1)));
        recordInteraction({ type: event.name, productId: item.item_id, quantity });
        return;
      }
      case "search": {
        // SearchBox reports every debounced keystroke pause; only record the
        // term the visitor settled on.
        if (searchTimer) clearTimeout(searchTimer);
        const query = event.params.search_term.trim().slice(0, 100);
        if (!query) return;
        searchTimer = setTimeout(() => recordInteraction({ type: "search", query }), SEARCH_SETTLE_MS);
        return;
      }
      default:
        return;
    }
  } catch {
    /* tracking must never break the page */
  }
}
