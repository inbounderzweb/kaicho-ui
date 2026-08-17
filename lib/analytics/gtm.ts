export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Pushes a raw entry onto the GTM dataLayer. Internal — UI/business code
 * should call `trackEvent` from `./events`, never this, so every call site
 * stays provider-agnostic (see events.ts).
 */
export function pushToDataLayer(data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}
