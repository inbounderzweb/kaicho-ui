"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { popupKeys } from "@/lib/hooks/query-keys";
import { usePublicPopups } from "@/lib/hooks/usePublicPopups";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { sendPopupEvent, type PopupDevice, type PublicPopup } from "@/lib/api/popup";
import { PopupController, createBrowserStore, createMemoryStore, type CloseReason, type DismissAttempt } from "@/lib/popup/controller";
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

// True once a popup linked to offers has reached the end of its timer (the
// soonest live offer's end). The popup hides right then; the server is asked
// again at that moment, because another linked offer may still be live (the
// popup then returns with the next end time) or none is (it stays gone).
function useOfferEnded(popup: PublicPopup | null): boolean {
  const queryClient = useQueryClient();
  const endsAt = popup?.linkedToOffer && popup.countdown?.endsAt ? Date.parse(popup.countdown.endsAt) : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endsAt === null) return;
    const wait = endsAt - Date.now();
    if (wait <= 0) {
      const t = setTimeout(() => setNow(Date.now()), 0);
      return () => clearTimeout(t);
    }
    // setTimeout caps at ~24.8 days; re-check periodically for longer offers.
    const t = setTimeout(() => setNow(Date.now()), Math.min(wait + 50, 2_147_000_000));
    return () => clearTimeout(t);
  }, [endsAt, now]);

  const ended = endsAt !== null && now >= endsAt;
  useEffect(() => {
    if (!ended) return;
    // The server's short HTTP cache can hand back the old list once, so ask a
    // few times (immediately, then every 10 s) until fresh data arrives.
    let tries = 0;
    const refresh = () => void queryClient.invalidateQueries({ queryKey: popupKeys.live });
    refresh();
    const id = setInterval(() => {
      if (++tries > 3) return clearInterval(id);
      refresh();
    }, 10_000);
    return () => clearInterval(id);
  }, [ended, queryClient]);
  return ended;
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
  // A popup tied to an offer goes away the moment that offer's timer runs out,
  // even if the page was opened before the server stopped returning it.
  const offerEnded = useOfferEnded(popup);
  const runtime = useMemo(() => (popup && device ? resolvePopupRuntime(popup, device) : null), [popup, device]);

  const allowed = popup && !offerEnded ? isPopupAllowedOnPath(pathname, popup.targeting.includePaths) : false;
  const pathAllowedRef = useRef(allowed);
  const controllerRef = useRef<PopupController | null>(null);
  const [view, setView] = useState<OpenView | null>(null);

  // Login detection for "show on every load": logged-out → logged-in without a
  // page refresh bumps this, which restarts the popup with a clean slate.
  // (A visitor who is ALREADY logged in at page load is covered by the page
  // load itself, so the first resolved value never counts as a login.)
  const { data: currentUser } = useCurrentUser();
  const [loginEpoch, setLoginEpoch] = useState(0);
  const prevUserRef = useRef<typeof currentUser>(undefined);
  useEffect(() => {
    if (prevUserRef.current === null && currentUser) setLoginEpoch((n) => n + 1);
    prevUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    pathAllowedRef.current = allowed;
  }, [allowed]);

  // One controller per (popup, revision, device). Re-renders, refetches that
  // return the same revision, and route changes never re-run this effect.
  // Only every-load popups restart on login; others keep their timers.
  const loginKey = runtime?.everyLoad ? loginEpoch : 0;
  const popupId = popup?.id;
  const revision = popup?.revision;
  useEffect(() => {
    if (!popup || !runtime || !device) return;
    const controller = new PopupController(runtime, {
      // Every-load popups remember nothing: a refresh is a brand-new start.
      store: runtime.everyLoad ? createMemoryStore() : createBrowserStore(popup.id),
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
  }, [popupId, revision, device, loginKey]);

  useEffect(() => {
    controllerRef.current?.setRouteAllowed(allowed);
  }, [allowed]);

  const onDismiss = useCallback((via: DismissAttempt) => {
    controllerRef.current?.dismiss(via);
  }, []);

  const onCtaClick = useCallback(() => {
    if (popup && device) void sendPopupEvent(popup.id, "CLICK", device);
  }, [popup, device]);

  if (!popup || !runtime || !device || !view || offerEnded) return null;

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
