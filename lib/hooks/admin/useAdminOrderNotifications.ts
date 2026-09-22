import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { ApiError } from "@/lib/api/ApiError";
import { apiFetch, BACKEND_ORIGIN } from "@/lib/api/client";

export interface AdminOrderNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  itemsCount: number;
  createdAt: string;
}

const MAX_STORED = 20;
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

// Real-time leg of the new-order admin notification feature (see
// kaicho-be's modules/notification). One admin-authenticated Socket.IO
// connection per mounted AdminShell, joined server-side to the "admin" room;
// an admin who's offline or has no tab open simply picks the order up from
// the normal /admin/orders list next time they look — this hook only adds
// the "someone's watching right now" fast path on top.
export function useAdminOrderNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AdminOrderNotification[]>([]);
  const [toasts, setToasts] = useState<AdminOrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
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

    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const socket = io(BACKEND_ORIGIN, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    // Get a fresh ticket via the same-origin API for each connection/reconnection.
    const connect = async () => {
      if (disposed) return;
      try {
        const { token } = await apiFetch<{ token: string }>("/admin/notifications/token", { method: "POST" });
        if (disposed) return;
        socket.auth = { token };
        socket.connect();
      } catch (error) {
        if (!disposed && !(error instanceof ApiError && [401, 403].includes(error.status))) {
          retryTimer = setTimeout(connect, 5000);
        }
      }
    };
    // Own retries so every reconnect obtains a fresh, short-lived ticket.
    socket.io.reconnection(false);
    const retry = () => {
      if (disposed) return;
      clearTimeout(retryTimer);
      retryTimer = setTimeout(connect, 5000);
    };
    socket.on("connect_error", retry);
    socket.on("disconnect", retry);
    void connect();


    socket.on("order:new", (payload: Omit<AdminOrderNotification, "id">) => {
      const entry: AdminOrderNotification = { ...payload, id: `${payload.orderId}-${payload.createdAt}` };
      setNotifications((prev) => [entry, ...prev].slice(0, MAX_STORED));
      setUnreadCount((prev) => prev + 1);
      setToasts((prev) => [...prev, entry]);
      startAlert();
    });

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      socket.disconnect();
      socketRef.current = null;
      stopAlert();
    };
  }, [enabled, startAlert, stopAlert]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    stopAlert();
    setUnreadCount(0);
  }, [stopAlert]);

  return { notifications, toasts, unreadCount, dismissToast, markAllRead };
}
