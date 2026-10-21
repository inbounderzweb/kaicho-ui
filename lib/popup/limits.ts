// Client mirror of kaicho-be/src/modules/popup/popup.limits.ts. The server is
// authoritative; these power inline form validation and the runtime's
// defensive clamp (a stale or hand-edited response can never produce a popup
// that outlives MAX_DISPLAY).

export const POPUP_LIMITS = {
  initialDelaySeconds: { min: 0, max: 300 },
  autoCloseAfterSeconds: { min: 3, max: 300 },
  maxDisplaySeconds: { min: 5, max: 600, default: 60 },
  sessionDisplayLimit: { min: 1, max: 10 },
  repeatIntervalSeconds: { min: 0, max: 86_400 },
  minReappearanceSeconds: { min: 5, max: 86_400 },
  dismissalWaitSeconds: { min: 60, max: 2_592_000 },
  earlyDismissLockMaxSeconds: 10,
  maxIncludePaths: 20,
} as const;

/** Routes where a popup must never show (money path, auth, account, admin). */
export const POPUP_EXCLUDED_PATH_PREFIXES = [
  "/admin",
  "/checkout",
  "/cart",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/payment",
  "/orders",
  "/profile",
] as const;

export const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
