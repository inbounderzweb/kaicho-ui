import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { BACKEND_ORIGIN } from "@/lib/api/client";

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

// A short two-tone chime built with the Web Audio API rather than a shipped
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
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.14;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.34);
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
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("order:new", (payload: Omit<AdminOrderNotification, "id">) => {
      const entry: AdminOrderNotification = { ...payload, id: `${payload.orderId}-${payload.createdAt}` };
      setNotifications((prev) => [entry, ...prev].slice(0, MAX_STORED));
      setUnreadCount((prev) => prev + 1);
      setToasts((prev) => [...prev, entry]);
      playChime();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return { notifications, toasts, unreadCount, dismissToast, markAllRead };
}
