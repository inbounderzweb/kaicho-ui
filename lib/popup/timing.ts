import type {
  PopupDevice,
  PublicPopup,
  PopupTimingSettings,
  CloseButtonPosition,
  CloseButtonSize,
  CloseButtonStyle,
  DismissalPolicy,
} from "../api/popup";
import { POPUP_LIMITS as L, POPUP_EXCLUDED_PATH_PREFIXES } from "./limits";

const clamp = (n: number, min: number, max: number, fallback: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;

/** Everything the controller + view need for ONE device, already clamped. */
export interface ResolvedPopupRuntime {
  popupId: string;
  device: PopupDevice;
  initialDelayMs: number;
  /** null = no auto-close (the max-duration backstop still applies). */
  autoCloseMs: number | null;
  /** Hard ceiling — ALWAYS enforced. */
  maxDisplayMs: number;
  countdownVisible: boolean;
  closeButtonEnabled: boolean;
  closeButtonPosition: CloseButtonPosition;
  closeButtonSize: CloseButtonSize;
  closeButtonStyle: CloseButtonStyle;
  backdropDismissEnabled: boolean;
  escapeDismissEnabled: boolean;
  allowEarlyDismiss: boolean;
  sessionDisplayLimit: number;
  repeatIntervalMs: number;
  minReappearanceMs: number;
  dismissalPolicy: DismissalPolicy;
  dismissalWaitMs: number;
}

/**
 * Pick the timing set for a device and clamp every number. Returns null when
 * the popup is switched off for that device.
 */
export function resolvePopupRuntime(popup: PublicPopup, device: PopupDevice): ResolvedPopupRuntime | null {
  if (!popup.devices[device].enabled) return null;

  const t: PopupTimingSettings = popup.timing.useSharedTimingSettings
    ? popup.timing.shared
    : popup.timing[device];
  const d = popup.display;

  const maxDisplaySeconds = clamp(
    d.maxDisplaySeconds,
    L.maxDisplaySeconds.min,
    L.maxDisplaySeconds.max,
    L.maxDisplaySeconds.default
  );
  const autoCloseSeconds = clamp(t.autoCloseAfterSeconds, L.autoCloseAfterSeconds.min, L.autoCloseAfterSeconds.max, 10);
  const allowEarlyDismiss = d.allowEarlyDismiss !== false;

  // When early dismissal is off, an auto-close timer is what releases the
  // visitor, so it is forced on and bounded — a bad config can't hold anyone.
  const autoCloseEnabled = t.autoCloseEnabled || !allowEarlyDismiss;
  const effectiveAutoCloseSeconds = allowEarlyDismiss
    ? Math.min(autoCloseSeconds, maxDisplaySeconds)
    : Math.min(autoCloseSeconds, L.earlyDismissLockMaxSeconds, maxDisplaySeconds);

  return {
    popupId: popup.id,
    device,
    initialDelayMs:
      clamp(t.initialDelaySeconds, L.initialDelaySeconds.min, L.initialDelaySeconds.max, 3) * 1000,
    autoCloseMs: autoCloseEnabled ? effectiveAutoCloseSeconds * 1000 : null,
    maxDisplayMs: maxDisplaySeconds * 1000,
    countdownVisible: Boolean(t.countdownVisible),
    closeButtonEnabled: Boolean(t.closeButtonEnabled),
    closeButtonPosition: t.closeButtonPosition === "TOP_LEFT" ? "TOP_LEFT" : "TOP_RIGHT",
    closeButtonSize: d.closeButtonSize ?? "MD",
    closeButtonStyle: d.closeButtonStyle ?? "SOLID",
    backdropDismissEnabled: Boolean(t.backdropDismissEnabled),
    escapeDismissEnabled: Boolean(t.escapeDismissEnabled),
    allowEarlyDismiss,
    sessionDisplayLimit: clamp(d.sessionDisplayLimit, L.sessionDisplayLimit.min, L.sessionDisplayLimit.max, 1),
    repeatIntervalMs:
      clamp(d.repeatIntervalSeconds, L.repeatIntervalSeconds.min, L.repeatIntervalSeconds.max, 0) * 1000,
    minReappearanceMs:
      clamp(d.minReappearanceSeconds, L.minReappearanceSeconds.min, L.minReappearanceSeconds.max, 30) * 1000,
    dismissalPolicy: d.dismissalPolicy ?? "SESSION_SUPPRESS",
    dismissalWaitMs:
      clamp(d.dismissalWaitSeconds, L.dismissalWaitSeconds.min, L.dismissalWaitSeconds.max, 86_400) * 1000,
  };
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);
}

/**
 * May a popup be shown on this path? Never on the excluded money/auth/admin
 * routes; otherwise honours the popup's include-list (empty = everywhere).
 */
export function isPopupAllowedOnPath(pathname: string | null | undefined, includePaths: string[]): boolean {
  if (!pathname) return false;
  if (POPUP_EXCLUDED_PATH_PREFIXES.some((p) => matchesPrefix(pathname, p))) return false;
  if (includePaths.length === 0) return true;
  return includePaths.some((p) => (p === "/" ? pathname === "/" : matchesPrefix(pathname, p)));
}

/** How long the popup stays visible once opened, for display in the admin. */
export function describeVisibleDuration(rt: Pick<ResolvedPopupRuntime, "autoCloseMs" | "maxDisplayMs">): {
  seconds: number;
  cappedByMax: boolean;
  viaAutoClose: boolean;
} {
  if (rt.autoCloseMs !== null && rt.autoCloseMs <= rt.maxDisplayMs) {
    return { seconds: rt.autoCloseMs / 1000, cappedByMax: false, viaAutoClose: true };
  }
  return { seconds: rt.maxDisplayMs / 1000, cappedByMax: true, viaAutoClose: false };
}
