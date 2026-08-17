/**
 * Single choke point for whether analytics/marketing scripts may load.
 * Currently always grants consent — there's no cookie-consent requirement
 * live on the site yet. When one is added, change ONLY this function (to
 * read a real consent cookie/state); GoogleTagManager and every call site
 * of `trackEvent` stay untouched, because they already funnel through here.
 */
export function hasAnalyticsConsent(): boolean {
  return true;
}
