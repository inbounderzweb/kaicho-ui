import type { PopupContent, PopupDevice } from "../api/popup";

/** Device artwork falls back to the original shared banner, never the other device. */
export function popupImageUrl(content: PopupContent, device: PopupDevice): string | undefined {
  const image = device === "desktop" ? content.desktopImageUrl : content.mobileImageUrl;
  return image || content.imageUrl || undefined;
}
