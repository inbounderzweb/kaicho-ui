import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ApiError } from "@/lib/api/ApiError";
import { apiFetch, BACKEND_ORIGIN } from "@/lib/api/client";

import { watchAdminOrderNotifications, type AdminOrderNotification, type AdminOrderFeed } from "@/lib/notifications/adminOrderNotifications";
export type { AdminOrderNotification } from "@/lib/notifications/adminOrderNotifications";
const ALERT_DURATION_MS = 60_000;
const ALERT_REPEAT_MS = 2400;

// A soft three-note doorbell chime built with the Web Audio API rather than a shipped
// audio file — no extra asset to host. Reused as a single long-lived context
// (not a fresh one per notification): a new AudioContext is created
// "suspended" by spec in several browsers (Safari in particular) even after
// a prior user gesture, and creating+starting one from inside an async
// socket-event callback — not the synchronous continuation of a click — is
// exactly the case autoplay policies are built to block. unlockAudio() below
// creates/resumes this same context from a real click/keydown, so by the
// time a notification arrives it's already running and playChime only has
// to schedule tones on it.
let sharedCtx: AudioContext | null = null;
const activeTones = new Set<OscillatorNode>();

function silenceChime(): void {
  for (const tone of activeTones) {
    try { tone.stop(); } catch { /* Already stopped. */ }
  }
  activeTones.clear();
}

function getAudioContextCtor(): typeof AudioContext | undefined {
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function unlockAudio(): void {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return;
  if (!sharedCtx) {
    try {
      sharedCtx = new Ctor();
    } catch {
      return;
    }
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => {
      // If this particular gesture wasn't enough to unlock it, the next
      // click/keydown will retry — playChime itself never depends on this
      // succeeding.
    });
  }
}

function playChime(): void {
  try {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return;
    if (!sharedCtx) sharedCtx = new Ctor();
    const ctx = sharedCtx;
    if (ctx.state === "suspended") {
      // Best-effort catch-up if no prior gesture reached unlockAudio (e.g.
      // the very first notification lands before any click) — this resume()
      // call is not gesture-backed, so browsers MAY still ignore it, but it
      // costs nothing to try and fixes it for every notification after.
      ctx.resume().catch(() => undefined);
    }
    const now = ctx.currentTime;
    // C5–E5–G5: a gentle rising major chord with a bell-like decay.
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.22;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9);
      osc.connect(gain).connect(ctx.destination);
      activeTones.add(osc);
      osc.onended = () => {
        activeTones.delete(osc);
        osc.disconnect();
        gain.disconnect();
      };
      osc.start(start);
      osc.stop(start + 0.92);
    });
  } catch {
    // Sound is a nice-to-have — never let it break the notification itself.
  }
}

// One socket per AdminShell, with durable history/polling for missed events.
export function useAdminOrderNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AdminOrderNotification[]>([]);
  const [toasts, setToasts] = useState<AdminOrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const watcherRef = useRef<ReturnType<typeof watchAdminOrderNotifications> | null>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAlert = useCallback(() => {
    if (repeatRef.current !== null) clearInterval(repeatRef.current);
    if (stopRef.current !== null) clearTimeout(stopRef.current);
    repeatRef.current = null;
    stopRef.current = null;
    silenceChime();
  }, []);

  const startAlert = useCallback(() => {
    stopAlert();
    const deadline = Date.now() + ALERT_DURATION_MS;
    playChime();
    repeatRef.current = setInterval(() => {
      if (Date.now() >= deadline) stopAlert();
      else playChime();
    }, ALERT_REPEAT_MS);
    stopRef.current = setTimeout(stopAlert, ALERT_DURATION_MS);
  }, [stopAlert]);

  // Any click/keydown anywhere in the admin panel counts as the gesture that
  // unlocks the shared AudioContext — cheap and passive (capture phase,
  // never preventDefault/stopPropagation), so it doesn't interfere with
  // normal admin UI interactions. Kept for the lifetime of the shell, not
  // removed after the first hit, since resume() is a no-op once already
  // running.
  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("pointerdown", unlockAudio, { capture: true });
    document.addEventListener("keydown", unlockAudio, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", unlockAudio, { capture: true });
      document.removeEventListener("keydown", unlockAudio, { capture: true });
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const socket = io(BACKEND_ORIGIN, {
      autoConnect: false,
      // WebSocket only: HTTP long-polling needs every request of a session to
      // hit the same server instance, which Cloud Run (multi-instance, no
      // sticky routing by default) doesn't guarantee — the handshake then
      // fails with "Session ID unknown" and the admin never connects.
      transports: ["websocket"],
    });
    const watcher = watchAdminOrderNotifications({
      socket,
      fetchFeed: () => apiFetch<AdminOrderFeed>("/admin/notifications", { cache: "no-store" }),
      fetchTicket: () => apiFetch<{ token: string }>("/admin/notifications/token", { method: "POST" }),
      markRead: (orderIds) => apiFetch("/admin/notifications/read", { method: "POST", body: JSON.stringify({ orderIds }) }),
      isAuthError: (error) => error instanceof ApiError && [401, 403].includes(error.status),
      onFeed: (feed) => {
        setNotifications(feed.items);
        setUnreadCount(feed.unreadCount);
        if (feed.unreadCount === 0) stopAlert();
      },
      onNewOrders: (orders) => {
        setToasts((previous) => [...orders, ...previous].slice(0, 3));
        startAlert();
      },
      onError: (error) => setLoadError(error !== null),
    });
    watcherRef.current = watcher;
    const refresh = () => { void watcher.refresh(); };
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      watcher.dispose();
      watcherRef.current = null;
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      stopAlert();
    };
  }, [enabled, startAlert, stopAlert]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    stopAlert();
    watcherRef.current?.markAllRead();
  }, [stopAlert]);

  return { notifications, toasts, unreadCount, loadError, dismissToast, markAllRead };
}
