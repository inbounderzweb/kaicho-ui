import type { Popup, PopupFormPayload, PopupTimingSettings } from "../api/popup";
import type { PopupFormValues } from "../validation/popup.schema";

export const DEFAULT_TIMING: PopupTimingSettings = {
  initialDelaySeconds: 3,
  autoCloseEnabled: true,
  autoCloseAfterSeconds: 10,
  countdownVisible: false,
  closeButtonEnabled: true,
  closeButtonPosition: "TOP_RIGHT",
  backdropDismissEnabled: true,
  escapeDismissEnabled: true,
};

export function defaultPopupForm(): PopupFormValues {
  return {
    name: "",
    priority: 100,
    content: { heading: "", body: "", imageUrl: "", desktopImageUrl: "", mobileImageUrl: "", imageAlt: "", ctaLabel: "", ctaUrl: "" },
    design: { theme: "LIGHT", size: "MD", imageOnly: false },
    devices: {
      desktop: { enabled: true, placement: "CENTER" },
      mobile: { enabled: true, placement: "BOTTOM_SHEET" },
    },
    timing: {
      useSharedTimingSettings: true,
      shared: { ...DEFAULT_TIMING },
      desktop: { ...DEFAULT_TIMING },
      mobile: { ...DEFAULT_TIMING },
    },
    display: {
      maxDisplaySeconds: 60,
      allowEarlyDismiss: true,
      closeButtonSize: "MD",
      closeButtonStyle: "SOLID",
      dismissalPolicy: "SESSION_SUPPRESS",
      dismissalWaitSeconds: 86_400,
      sessionDisplayLimit: 1,
      repeatIntervalSeconds: 0,
      minReappearanceSeconds: 30,
      showOnEveryLoad: false,
    },
    countdown: { enabled: false, endsAt: null, label: "" },
    targeting: { includePaths: [] },
    schedule: { startsAt: null, endsAt: null },
  };
}

export function popupToFormValues(p: Popup): PopupFormValues {
  return {
    name: p.name,
    priority: p.priority,
    content: {
      heading: p.content.heading,
      body: p.content.body,
      imageUrl: p.content.imageUrl ?? "",
      desktopImageUrl: p.content.desktopImageUrl ?? "",
      mobileImageUrl: p.content.mobileImageUrl ?? "",
      imageAlt: p.content.imageAlt ?? "",
      ctaLabel: p.content.ctaLabel ?? "",
      ctaUrl: p.content.ctaUrl ?? "",
    },
    design: p.design,
    devices: p.devices,
    timing: p.timing,
    display: p.display,
    countdown: p.countdown,
    targeting: p.targeting,
    schedule: { startsAt: p.schedule.startsAt, endsAt: p.schedule.endsAt },
  };
}

/** Empty optional strings are omitted (the API treats absent as "not set"). */
export function formValuesToPayload(v: PopupFormValues): PopupFormPayload {
  const opt = (s: string | undefined) => (s && s.trim() ? s.trim() : undefined);
  return {
    name: v.name.trim(),
    priority: v.priority,
    content: {
      heading: v.content.heading.trim(),
      body: v.content.body.trim(),
      imageUrl: opt(v.content.imageUrl),
      desktopImageUrl: opt(v.content.desktopImageUrl),
      mobileImageUrl: opt(v.content.mobileImageUrl),
      imageAlt: opt(v.content.imageAlt),
      ctaLabel: opt(v.content.ctaLabel),
      ctaUrl: opt(v.content.ctaUrl),
    },
    design: v.design,
    devices: v.devices,
    timing: v.timing,
    display: v.display,
    countdown: {
      enabled: v.countdown.enabled,
      endsAt: v.countdown.endsAt || null,
      label: opt(v.countdown.label),
    },
    targeting: { includePaths: v.targeting.includePaths.map((p) => p.trim()).filter(Boolean) },
    schedule: { startsAt: v.schedule.startsAt || null, endsAt: v.schedule.endsAt || null },
  };
}

import { resolvePopupRuntime, type ResolvedPopupRuntime } from "./timing";
import type { PopupDevice, PublicPopup } from "../api/popup";

/**
 * Keep the two timing sets the admin can't currently see equal to a set they
 * can, so a stale hidden set can never fail validation or ship surprising
 * values. (Shared mode → per-device sets mirror shared; per-device mode →
 * the unused shared set mirrors desktop.)
 */
export function normalizeForSubmit(v: PopupFormValues): PopupFormValues {
  const t = v.timing;
  if (t.useSharedTimingSettings) {
    return { ...v, timing: { ...t, desktop: { ...t.shared }, mobile: { ...t.shared } } };
  }
  return { ...v, timing: { ...t, shared: { ...t.desktop } } };
}

/** Build the exact runtime the storefront would use for these (unsaved) form values. */
export function runtimeFromForm(v: PopupFormValues, device: PopupDevice): {
  popup: PublicPopup;
  runtime: ResolvedPopupRuntime | null;
} {
  const payload = formValuesToPayload(normalizeForSubmit(v));
  const popup: PublicPopup = {
    id: "preview",
    revision: "preview",
    content: payload.content,
    design: payload.design,
    devices: payload.devices,
    timing: payload.timing,
    display: payload.display,
    countdown: payload.countdown,
    targeting: payload.targeting,
  };
  return { popup, runtime: resolvePopupRuntime(popup, device) };
}
