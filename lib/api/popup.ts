import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";

// Admin: /api/admin/popups/* (requireAuth + requireRole("admin")).
// Public: GET /api/popups (live popups) and POST /api/popups/:id/events.

export const POPUP_STATUSES = ["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED"] as const;
export type PopupStatus = (typeof POPUP_STATUSES)[number];
export type PopupEffectiveState = PopupStatus | "SCHEDULED" | "LIVE" | "EXPIRED";

export type PopupTheme = "LIGHT" | "DARK" | "BRAND";
export type PopupSize = "SM" | "MD" | "LG";
export type DesktopPlacement = "CENTER" | "BOTTOM_RIGHT" | "BOTTOM_LEFT";
export type MobilePlacement = "CENTER" | "BOTTOM_SHEET";
export type CloseButtonPosition = "TOP_RIGHT" | "TOP_LEFT";
export type CloseButtonSize = "SM" | "MD" | "LG";
export type CloseButtonStyle = "SUBTLE" | "SOLID" | "OUTLINED";
export type DismissalPolicy = "SESSION_SUPPRESS" | "WAIT_INTERVAL" | "FOLLOW_FREQUENCY";
export type PopupDevice = "desktop" | "mobile";

export interface PopupTimingSettings {
  initialDelaySeconds: number;
  autoCloseEnabled: boolean;
  autoCloseAfterSeconds: number;
  countdownVisible: boolean;
  closeButtonEnabled: boolean;
  closeButtonPosition: CloseButtonPosition;
  backdropDismissEnabled: boolean;
  escapeDismissEnabled: boolean;
}

export interface PopupContent {
  heading: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface PopupDisplay {
  maxDisplaySeconds: number;
  allowEarlyDismiss: boolean;
  closeButtonSize: CloseButtonSize;
  closeButtonStyle: CloseButtonStyle;
  dismissalPolicy: DismissalPolicy;
  dismissalWaitSeconds: number;
  sessionDisplayLimit: number;
  repeatIntervalSeconds: number;
  minReappearanceSeconds: number;
}

/** The editable configuration (also what a PATCH/POST body is built from). */
export interface PopupConfig {
  content: PopupContent;
  design: { theme: PopupTheme; size: PopupSize };
  devices: {
    desktop: { enabled: boolean; placement: DesktopPlacement };
    mobile: { enabled: boolean; placement: MobilePlacement };
  };
  timing: {
    useSharedTimingSettings: boolean;
    shared: PopupTimingSettings;
    desktop: PopupTimingSettings;
    mobile: PopupTimingSettings;
  };
  display: PopupDisplay;
  /** Optional urgency timer (d/h/m/s to endsAt). Independent of auto-close. */
  countdown: { enabled: boolean; endsAt: string | null; label?: string };
  targeting: { includePaths: string[] };
}

export interface PopupDeviceAnalytics {
  impressions: number;
  clicks: number;
  manualCloses: number;
  autoCloses: number;
}

export interface Popup extends PopupConfig {
  id: string;
  name: string;
  status: PopupStatus;
  effectiveState: PopupEffectiveState;
  priority: number;
  schedule: { startsAt: string | null; endsAt: string | null };
  analytics: { desktop: PopupDeviceAnalytics; mobile: PopupDeviceAnalytics };
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What the storefront receives from GET /api/popups. */
export interface PublicPopup extends PopupConfig {
  id: string;
  /** Changes whenever the admin edits the popup — the runtime restarts on it. */
  revision: string;
}

export interface PopupFormPayload extends PopupConfig {
  name: string;
  priority: number;
  schedule: { startsAt?: string | null; endsAt?: string | null };
}

export type PopupStatusFilter = "all" | PopupStatus;

export interface PopupQueryParams extends PageParams {
  search?: string;
  status?: PopupStatusFilter;
}

function buildQuery({ page = 1, pageSize = 20, search, status }: PopupQueryParams): string {
  let qs = `?page=${page}&pageSize=${pageSize}`;
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") qs += `&status=${status}`;
  return qs;
}

const base = "/admin/popups";

export const fetchPopups = (params: PopupQueryParams = {}) =>
  apiFetch<Paginated<Popup>>(`${base}${buildQuery(params)}`, { method: "GET" });

export const fetchPopup = (id: string) =>
  apiFetch<{ popup: Popup }>(`${base}/${encodeURIComponent(id)}`, { method: "GET" });

export const createPopup = (payload: PopupFormPayload) =>
  apiFetch<{ popup: Popup }>(base, { method: "POST", body: JSON.stringify(payload) });

export const updatePopup = (id: string, patch: Partial<PopupFormPayload>) =>
  apiFetch<{ popup: Popup }>(`${base}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

export const setPopupStatus = (id: string, status: PopupStatus) =>
  apiFetch<{ popup: Popup }>(`${base}/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deletePopup = (id: string) =>
  apiFetch<void>(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });

// ---- Public (storefront) ----

export const fetchLivePopups = () =>
  apiFetch<{ popups: PublicPopup[] }>("/popups", { method: "GET" });

export type PopupEventType = "IMPRESSION" | "CLICK" | "DISMISS" | "AUTO_CLOSE";

/** Fire-and-forget analytics beacon. Never throws — analytics must not break the page. */
export async function sendPopupEvent(id: string, type: PopupEventType, device: PopupDevice): Promise<void> {
  try {
    await apiFetch<void>(`/popups/${encodeURIComponent(id)}/events`, {
      method: "POST",
      body: JSON.stringify({ type, device }),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}
