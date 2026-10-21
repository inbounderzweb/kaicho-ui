"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { usePublicPopups } from "@/lib/hooks/usePublicPopups";
import { sendPopupEvent, type PopupDevice, type PublicPopup } from "@/lib/api/popup";
import { PopupController, createBrowserStore, type CloseReason, type DismissAttempt } from "@/lib/popup/controller";
import { isPopupAllowedOnPath, resolvePopupRuntime } from "@/lib/popup/timing";
import { MOBILE_MEDIA_QUERY } from "@/lib/popup/limits";
import PopupView from "./PopupView";

// Device is decided ONCE per page load. Resizing across the breakpoint must
// not restart timers or swap the popup's configuration mid-flight.
const noopSubscribe = () => () => {};
function readDevice(): PopupDevice {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches ? "mobile" : "desktop";
}

function eventFor(reason: CloseReason): "DISMISS" | "AUTO_CLOSE" | null {
  if (reason === "manual" || reason === "backdrop" || reason === "escape") return "DISMISS";
  if (reason === "auto" || reason === "max-duration") return "AUTO_CLOSE";
  return null; // "route": the visitor navigated away — not a dismissal
}

interface OpenView {
  closesAt: number;
}

export default function StorefrontPopup() {
  const pathname = usePathname();
  const device = useSyncExternalStore<PopupDevice | null>(noopSubscribe, readDevice, () => null);
  const { data: popups } = usePublicPopups(device !== null);

  // Highest-priority popup that is switched on for this device. (The backend
  // already orders by priority and only returns live ones.)
  const popup: PublicPopup | null = useMemo(
    () => (device && popups?.find((p) => p.devices[device].enabled)) || null,
    [popups, device]
  );
  const runtime = useMemo(() => (popup && device ? resolvePopupRuntime(popup, device) : null), [popup, device]);

  const allowed = popup ? isPopupAllowedOnPath(pathname, popup.targeting.includePaths) : false;
  const pathAllowedRef = useRef(allowed);
  const controllerRef = useRef<PopupController | null>(null);
  const [view, setView] = useState<OpenView | null>(null);

  useEffect(() => {
    pathAllowedRef.current = allowed;
  }, [allowed]);

  // One controller per (popup, revision, device). Re-renders, refetches that
  // return the same revision, and route changes never re-run this effect.
  const popupId = popup?.id;
  const revision = popup?.revision;
  useEffect(() => {
    if (!popup || !runtime || !device) return;
    const controller = new PopupController(runtime, {
      store: createBrowserStore(popup.id),
      onOpen: ({ closesAt }) => {
        setView({ closesAt });
        void sendPopupEvent(popup.id, "IMPRESSION", device);
      },
      onClose: (reason) => {
        setView(null);
        const event = eventFor(reason);
        if (event) void sendPopupEvent(popup.id, event, device);
      },
    });
    controllerRef.current = controller;
    controller.start(pathAllowedRef.current);
    return () => {
      controller.destroy();
      controllerRef.current = null;
      setView(null);
    };
    // popup/runtime are derived from (popupId, revision, device); depending on
    // the objects themselves would restart timers on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupId, revision, device]);

  useEffect(() => {
    controllerRef.current?.setRouteAllowed(allowed);
  }, [allowed]);

  const onDismiss = useCallback((via: DismissAttempt) => {
    controllerRef.current?.dismiss(via);
  }, []);

  const onCtaClick = useCallback(() => {
    if (popup && device) void sendPopupEvent(popup.id, "CLICK", device);
  }, [popup, device]);

  if (!popup || !runtime || !device || !view) return null;

  return (
    <PopupView
      popup={popup}
      runtime={runtime}
      device={device}
      closesAt={view.closesAt}
      dismissLocked={!runtime.allowEarlyDismiss}
      onDismiss={onDismiss}
      onCtaClick={onCtaClick}
    />
  );
}
