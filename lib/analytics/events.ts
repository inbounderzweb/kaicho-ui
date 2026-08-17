import { pushToDataLayer } from "./gtm";
import { hasAnalyticsConsent } from "./consent";
import type { StandardEvent, StandardEventName } from "./types";

/**
 * The one entry point business/UI code should use to report an event. Keeps
 * every call site provider-agnostic — today this pushes to the GTM
 * dataLayer; adding a destination (GA4 direct, Meta CAPI, Google Ads) later
 * only changes this function, not the call sites scattered across features.
 *
 * Strongly typed against `StandardEvent` so `trackEvent("purchase", {...})`
 * requires exactly the params that event needs — see types.ts.
 */
export function trackEvent<N extends StandardEventName>(
  name: N,
  params: Extract<StandardEvent, { name: N }>["params"]
) {
  if (!hasAnalyticsConsent()) return;
  pushToDataLayer({ event: name, ...params });
}
