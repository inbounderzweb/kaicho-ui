import { z } from "zod";
import { POPUP_LIMITS as L } from "../popup/limits";
import { COUNTDOWN_POSITIONS, DESKTOP_PLACEMENTS } from "../api/popup";

// Inline UX validation for the popup editor. kaicho-be's popup.validation.ts
// re-validates and is authoritative — keep the rules in lockstep.

const num = (label: string, min: number, max: number) =>
  z
    .number({ message: `${label}: enter a number` })
    .int(`${label}: whole numbers only`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

export const timingSettingsSchema = z.object({
  initialDelaySeconds: num("Initial delay", L.initialDelaySeconds.min, L.initialDelaySeconds.max),
  autoCloseEnabled: z.boolean(),
  autoCloseAfterSeconds: num("Auto-close timer", L.autoCloseAfterSeconds.min, L.autoCloseAfterSeconds.max),
  countdownVisible: z.boolean(),
  closeButtonEnabled: z.boolean(),
  closeButtonPosition: z.enum(["TOP_RIGHT", "TOP_LEFT"]),
  backdropDismissEnabled: z.boolean(),
  escapeDismissEnabled: z.boolean(),
});

export function isSafePopupHref(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//") && !value.includes("\\");
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const href = (label: string) =>
  z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === "" || isSafePopupHref(v), `${label} must be an https:// URL or a path starting with /`);

export const popupFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120, "Name must be at most 120 characters"),
    priority: num("Priority", 0, 1000),
    content: z.object({
      heading: z.string().trim().max(120, "Heading must be at most 120 characters"),
      body: z.string().trim().max(500, "Body must be at most 500 characters"),
      imageUrl: z.string().trim().max(2048).optional(),
      desktopImageUrl: href("Desktop banner image").optional(),
      mobileImageUrl: href("Mobile banner image").optional(),
      imageAlt: z.string().trim().max(200).optional(),
      ctaLabel: z.string().trim().max(40, "Button label must be at most 40 characters").optional(),
      ctaUrl: href("Button link").optional(),
    }),
    design: z.object({ theme: z.enum(["LIGHT", "DARK", "BRAND"]), size: z.enum(["SM", "MD", "LG"]), imageOnly: z.boolean().optional() }),
    devices: z.object({
      desktop: z.object({ enabled: z.boolean(), placement: z.enum(DESKTOP_PLACEMENTS) }),
      mobile: z.object({ enabled: z.boolean(), placement: z.enum(["CENTER", "BOTTOM_SHEET"]) }),
    }),
    timing: z.object({
      useSharedTimingSettings: z.boolean(),
      shared: timingSettingsSchema,
      desktop: timingSettingsSchema,
      mobile: timingSettingsSchema,
    }),
    display: z.object({
      maxDisplaySeconds: num("Maximum display time", L.maxDisplaySeconds.min, L.maxDisplaySeconds.max),
      allowEarlyDismiss: z.boolean(),
      closeButtonSize: z.enum(["SM", "MD", "LG"]),
      closeButtonStyle: z.enum(["SUBTLE", "SOLID", "OUTLINED"]),
      dismissalPolicy: z.enum(["SESSION_SUPPRESS", "WAIT_INTERVAL", "FOLLOW_FREQUENCY"]),
      dismissalWaitSeconds: num("Dismissal wait", L.dismissalWaitSeconds.min, L.dismissalWaitSeconds.max),
      sessionDisplayLimit: num("Session display limit", L.sessionDisplayLimit.min, L.sessionDisplayLimit.max),
      repeatIntervalSeconds: num("Repeat interval", L.repeatIntervalSeconds.min, L.repeatIntervalSeconds.max),
      showOnEveryLoad: z.boolean().optional(),
      minReappearanceSeconds: num("Minimum reappearance delay", L.minReappearanceSeconds.min, L.minReappearanceSeconds.max),
    }),
    countdown: z.object({
      enabled: z.boolean(),
      endsAt: z.string().nullable().optional(),
      label: z.string().trim().max(80, "Headline must be at most 80 characters").optional(),
      position: z.enum(COUNTDOWN_POSITIONS).optional(),
    }),
    targeting: z.object({ includePaths: z.array(z.string()).max(L.maxIncludePaths) }),
    schedule: z.object({
      startsAt: z.string().nullable().optional(),
      endsAt: z.string().nullable().optional(),
    }),
  })
  .superRefine((v, ctx) => {
    const add = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    const { content, display, timing, schedule } = v;

    if (Boolean(content.ctaLabel) !== Boolean(content.ctaUrl)) {
      add(["content", content.ctaLabel ? "ctaUrl" : "ctaLabel"], "A call-to-action needs both a button label and a link");
    }
    if (v.design.imageOnly && !content.imageUrl && !content.desktopImageUrl && !content.mobileImageUrl) {
      add(["design", "imageOnly"], "Image-only needs an image — add one first");
    }
    if (v.countdown.enabled && !v.countdown.endsAt) {
      add(["countdown", "endsAt"], "Set the countdown end time");
    }
    if (content.imageUrl && !isSafePopupHref(content.imageUrl)) {
      add(["content", "imageUrl"], "Image must be an https:// URL or a path starting with /");
    }
    for (const [i, p] of v.targeting.includePaths.entries()) {
      if (!p.startsWith("/") || p.startsWith("//")) add(["targeting", "includePaths", i], "Paths must start with a single /");
    }
    if (schedule.startsAt && schedule.endsAt && new Date(schedule.endsAt) <= new Date(schedule.startsAt)) {
      add(["schedule", "endsAt"], "End time must be after the start time");
    }
    if (display.repeatIntervalSeconds > 0 && display.repeatIntervalSeconds < display.minReappearanceSeconds) {
      add(["display", "repeatIntervalSeconds"], "Repeat interval must be at least the minimum reappearance delay");
    }
    if (display.dismissalPolicy === "WAIT_INTERVAL" && display.dismissalWaitSeconds < display.minReappearanceSeconds) {
      add(["display", "dismissalWaitSeconds"], "Dismissal wait must be at least the minimum reappearance delay");
    }
    for (const key of ["shared", "desktop", "mobile"] as const) {
      const s = timing[key];
      if (s.autoCloseEnabled && s.autoCloseAfterSeconds > display.maxDisplaySeconds) {
        add(["timing", key, "autoCloseAfterSeconds"], `Auto-close timer cannot exceed the maximum display time (${display.maxDisplaySeconds}s)`);
      }
      if (!display.allowEarlyDismiss && (!s.autoCloseEnabled || s.autoCloseAfterSeconds > L.earlyDismissLockMaxSeconds)) {
        add(
          ["timing", key, "autoCloseAfterSeconds"],
          `Disabling early dismissal requires auto-close of ${L.earlyDismissLockMaxSeconds}s or less, so visitors are never held`
        );
      }
    }
  });

export type PopupFormValues = z.input<typeof popupFormSchema>;
