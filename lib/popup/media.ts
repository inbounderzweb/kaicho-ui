import type { PopupContent, PopupDevice } from "../api/popup";

/**
 * Each device shows its own banner. The shared `imageUrl` is only a legacy
 * fallback for popups that never got device-specific artwork; once either
 * device image is set, a device without one gets no banner (never the old
 * shared one).
 */
export function popupImageUrl(content: PopupContent, device: PopupDevice): string | undefined {
  const image = device === "desktop" ? content.desktopImageUrl : content.mobileImageUrl;
  if (image) return image;
  const hasDeviceImages = Boolean(content.desktopImageUrl || content.mobileImageUrl);
  return hasDeviceImages ? undefined : content.imageUrl || undefined;
}
