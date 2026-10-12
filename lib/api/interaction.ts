import { apiFetch } from "./client";

// Backed by kaicho-be's private interaction endpoints (all requireAuth).
export interface TrackingConsent {
  granted: boolean;
  version: number | null;
  updatedAt: string | null;
}
// The current consent is NOT fetched on its own: it arrives inside the
// /auth/me response the app already makes (see useTrackingConsent).

// Only what the browser is allowed to report. Wishlist changes, checkout and
// purchases are recorded by the server itself (the backend rejects them from
// the browser to avoid double counting and forged purchases).
export type InteractionEventType =
  | "product_view"
  | "category_view"
  | "search"
  | "add_to_cart"
  | "remove_from_cart";

export interface InteractionEvent {
  eventId: string;
  sessionId: string;
  type: InteractionEventType;
  productId?: string;
  categoryId?: string;
  query?: string;
  quantity?: number;
  clientTs: string;
}

export interface RecordResult {
  tracking: "enabled" | "disabled";
  recorded: number;
  duplicates: number;
  rejected: number;
}

export function updateTrackingConsent(granted: boolean): Promise<TrackingConsent> {
  return apiFetch<TrackingConsent>("/me/tracking-consent", {
    method: "PUT",
    body: JSON.stringify({ granted }),
  });
}

export function deleteInteractionData(): Promise<{ deleted: number }> {
  return apiFetch<{ deleted: number }>("/me/interaction-data", { method: "DELETE" });
}

// keepalive lets the final batch survive the tab closing.
export function sendInteractions(events: InteractionEvent[]): Promise<RecordResult> {
  return apiFetch<RecordResult>("/interactions", {
    method: "POST",
    body: JSON.stringify({ events }),
    keepalive: true,
  });
}
