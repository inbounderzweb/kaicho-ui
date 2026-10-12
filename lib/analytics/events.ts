import { pushToDataLayer } from "./gtm";
import { hasAnalyticsConsent } from "./consent";
import { forwardAnalyticsEvent } from "../interaction/bridge";
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
  // Private interaction history has its own account-level opt-in, so it is
  // forwarded before (and independently of) the GTM consent gate below.
  forwardAnalyticsEvent({ name, params } as StandardEvent);
  if (!hasAnalyticsConsent()) return;
  pushToDataLayer({ event: name, ...params });
}
