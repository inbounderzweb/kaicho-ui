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
// time a notification arrives it's already running and playAlert only has
// to schedule tones on it.
let sharedCtx: AudioContext | null = null;
const activeTones = new Set<OscillatorNode>();

function silenceChime(): void {
  for (const tone of activeTones) {
    try { tone.stop(); } catch { /* Already stopped. */ }
  }
  activeTones.clear();
}

// A continuous, effectively inaudible tone keeps the tab marked "playing audio".
// Chrome/Edge/Safari/Firefox exempt such tabs from aggressive background
// throttling and freezing, so the socket heartbeat and polling stay alive while
// the window is minimized or buried behind others. Runs from the moment the
// admin confirms alerts until logout (the hook's enabled flag drops).
let keepAlive: { osc: OscillatorNode; gain: GainNode } | null = null;

function startKeepAlive(): void {
  if (keepAlive || !sharedCtx || sharedCtx.state !== "running") return;
  try {
    const osc = sharedCtx.createOscillator();
    const gain = sharedCtx.createGain();
    osc.frequency.value = 20; // sub-audible
    gain.gain.value = 0.001;
    osc.connect(gain).connect(sharedCtx.destination);
    osc.start();
    keepAlive = { osc, gain };
  } catch { /* Best-effort. */ }
}

function stopKeepAlive(): void {
  if (!keepAlive) return;
  try { keepAlive.osc.stop(); } catch { /* Already stopped. */ }
  keepAlive.osc.disconnect();
  keepAlive.gain.disconnect();
  keepAlive = null;
}

// OS-level notification: shows (and the OS plays its own sound) even when the
// browser is minimized or the tab is hidden, in every major browser.
function showSystemNotification(orders: AdminOrderNotification[]): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  for (const o of orders) {
    try {
      const n = new Notification(`New order ${o.orderNumber}`, {
        body: `${o.customerName} · ${o.itemsCount} item${o.itemsCount === 1 ? "" : "s"} · ₹${o.amount}`,
        tag: `order-${o.orderId}`,
        requireInteraction: true,
      });
      n.onclick = () => { window.focus(); window.location.href = `/admin/orders/${o.orderId}`; n.close(); };
    } catch { /* Some mobile browsers only allow service-worker notifications. */ }
  }
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
  if (sharedCtx.state !== "running") {
    sharedCtx.resume().catch(() => {
      // If this particular gesture wasn't enough to unlock it, the next
      // click/keydown will retry — playAlert itself never depends on this
      // succeeding.
    });
  }
}

// Schedules the whole alert (chimes every ALERT_REPEAT_MS for ALERT_DURATION_MS)
// up front on the audio clock instead of from setInterval. A minimized or
// background Chrome tab throttles timers (down to ~1/min after 5 minutes
// hidden), which would stretch the repeats out; the audio clock is not
// throttled, so the ringing stays steady while the window is minimized.
function playAlert(): boolean {
  try {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return false;
    if (!sharedCtx) sharedCtx = new Ctor();
    const ctx = sharedCtx;
    if (ctx.state !== "running") {
      // Best-effort: not gesture-backed, so browsers MAY ignore it. Never
      // schedule on a non-running context — currentTime is frozen, so tones
      // would pile up and blast out together on unlock.
      ctx.resume().catch(() => undefined);
      return false;
    }
    const base = ctx.currentTime;
    const repeats = Math.ceil(ALERT_DURATION_MS / ALERT_REPEAT_MS);
    for (let r = 0; r < repeats; r++) {
      // C5–E5–G5: a gentle rising major chord with a bell-like decay.
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = base + (r * ALERT_REPEAT_MS) / 1000 + i * 0.22;
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
    }
    return true;
  } catch {
    // Sound is a nice-to-have — never let it break the notification itself.
    return false;
  }
}

// One socket per AdminShell, with durable history/polling for missed events.
export function useAdminOrderNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AdminOrderNotification[]>([]);
  const [toasts, setToasts] = useState<AdminOrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [soundReady, setSoundReady] = useState(true);
  const [needsConfirm, setNeedsConfirm] = useState(false);
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
    if (!playAlert()) {
      // Browser still blocks audio: retry until a click unlocks it. The rest of
      // the window is then scheduled from that moment.
      repeatRef.current = setInterval(() => {
        const remaining = deadline - Date.now();
        if (remaining <= 0) stopAlert();
        else if (playAlert() && repeatRef.current !== null) {
          clearInterval(repeatRef.current);
          repeatRef.current = null;
        }
      }, 1000);
    }
    stopRef.current = setTimeout(stopAlert, ALERT_DURATION_MS);
  }, [stopAlert]);

  // Called from the post-login confirmation click: unlocks audio, starts the
  // keep-alive, asks for OS notification permission and rings a short test.
  const enableAlerts = useCallback(() => {
    unlockAudio();
    void sharedCtx?.resume().then(() => {
      startKeepAlive();
      setSoundReady(true);
      setNeedsConfirm(false);
      playAlert();
      setTimeout(silenceChime, 2500);
    }).catch(() => undefined);
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  const dismissConfirm = useCallback(() => setNeedsConfirm(false), []);

  // Any click/keydown anywhere in the admin panel counts as the gesture that
  // unlocks the shared AudioContext — cheap and passive (capture phase,
  // never preventDefault/stopPropagation), so it doesn't interfere with
  // normal admin UI interactions. Kept for the lifetime of the shell, not
  // removed after the first hit, since resume() is a no-op once already
  // running.
  useEffect(() => {
    if (!enabled) return;
    const sync = () => {
      const running = sharedCtx?.state === "running";
      setSoundReady(running);
      if (running) startKeepAlive();
    };
    // Show the "confirm alerts" prompt once per login if audio isn't unlocked.
    if (sharedCtx?.state !== "running") setNeedsConfirm(true);
    const poll = setInterval(sync, 1000);
    sync();
    const events = ["pointerdown", "touchend", "click", "keydown"] as const;
    for (const type of events) document.addEventListener(type, unlockAudio, { capture: true });
    return () => {
      clearInterval(poll);
      // Logout / shell unmount: stop everything so nothing rings afterwards.
      stopKeepAlive();
      silenceChime();
      setNeedsConfirm(false);
      for (const type of events) document.removeEventListener(type, unlockAudio, { capture: true });
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
        showSystemNotification(orders);
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

  return { notifications, toasts, unreadCount, loadError, soundReady, needsConfirm, enableAlerts, dismissConfirm, dismissToast, markAllRead };
}
