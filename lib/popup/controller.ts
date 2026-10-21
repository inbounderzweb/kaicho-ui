import type { ResolvedPopupRuntime } from "./timing";

// The popup lifecycle as a plain, framework-free state machine. React
// (StorefrontPopup / the admin preview) only mounts it, forwards events to it
// and renders what it reports — which is what makes the timing rules
// testable with fake timers and keeps re-renders from restarting anything:
// a controller is created once per (popup, revision), never per render.
//
//   idle ──start()──▶ pending ──(delay)──▶ open ──(close)──▶ closed
//                        ▲                                      │
//                        └────────── repeat rules ──────────────┘
//
// Timers owned: `pendingTimer` (initial delay / repeat), `autoCloseTimer`,
// `maxTimer` (hard ceiling, ALWAYS armed while open). destroy() clears all.

export type CloseReason = "manual" | "backdrop" | "escape" | "auto" | "max-duration" | "route";
export type DismissAttempt = "manual" | "backdrop" | "escape";
export type ControllerState = "idle" | "pending" | "open" | "closed" | "destroyed";

export interface PopupStoredState {
  /** Times this popup opened this browser session. */
  shown: number;
  /** ms epoch of the last close, 0 if never. */
  lastClosedAt: number;
  /** Visitor dismissed with SESSION_SUPPRESS — no more this session. */
  suppressed: boolean;
  /** ms epoch before which a WAIT_INTERVAL dismissal blocks reopening. */
  waitUntil: number;
}

export interface PopupStore {
  read(): PopupStoredState;
  write(patch: Partial<PopupStoredState>): void;
}

export const EMPTY_STORED_STATE: PopupStoredState = {
  shown: 0,
  lastClosedAt: 0,
  suppressed: false,
  waitUntil: 0,
};

export function createMemoryStore(initial: Partial<PopupStoredState> = {}): PopupStore {
  let state: PopupStoredState = { ...EMPTY_STORED_STATE, ...initial };
  return {
    read: () => ({ ...state }),
    write: (patch) => {
      state = { ...state, ...patch };
    },
  };
}

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

function safeStorage(kind: "sessionStorage" | "localStorage"): Storage | null {
  try {
    const s = globalThis[kind];
    if (!s) return null;
    s.getItem("__probe__");
    return s;
  } catch {
    return null; // private mode / blocked storage
  }
}

/**
 * Browser-backed store. Session-scoped facts (count, suppression) live in
 * sessionStorage; the WAIT_INTERVAL deadline lives in localStorage so it
 * survives a new session. If storage is blocked it silently degrades to
 * memory — the popup then behaves per page-load, never throws.
 */
export function createBrowserStore(popupId: string): PopupStore {
  const sessionKey = `kaicho:popup:${popupId}:session`;
  const waitKey = `kaicho:popup:${popupId}:wait`;
  const fallback = createMemoryStore();

  return {
    read() {
      const mem = fallback.read();
      try {
        const raw = safeStorage("sessionStorage")?.getItem(sessionKey);
        const parsed = raw ? (JSON.parse(raw) as Partial<PopupStoredState>) : {};
        const wait = Number(safeStorage("localStorage")?.getItem(waitKey) ?? 0);
        return {
          shown: Math.max(mem.shown, Number(parsed.shown) || 0),
          lastClosedAt: Math.max(mem.lastClosedAt, Number(parsed.lastClosedAt) || 0),
          suppressed: mem.suppressed || parsed.suppressed === true,
          waitUntil: Math.max(mem.waitUntil, Number.isFinite(wait) ? wait : 0),
        };
      } catch {
        return mem;
      }
    },
    write(patch) {
      fallback.write(patch);
      try {
        const { shown, lastClosedAt, suppressed } = fallback.read();
        safeStorage("sessionStorage")?.setItem(sessionKey, JSON.stringify({ shown, lastClosedAt, suppressed }));
        if (patch.waitUntil !== undefined) {
          safeStorage("localStorage")?.setItem(waitKey, String(patch.waitUntil));
        }
      } catch {
        // storage full / blocked — memory fallback already has it
      }
    },
  };
}

export interface ControllerDeps {
  store: PopupStore;
  now?: () => number;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  onOpen?: (info: { openedAt: number; closesAt: number }) => void;
  onClose?: (reason: CloseReason) => void;
}

export class PopupController {
  private _state: ControllerState = "idle";
  private routeAllowed = true;
  private pendingTimer: unknown = null;
  private autoCloseTimer: unknown = null;
  private maxTimer: unknown = null;
  private openedAt = 0;
  /** No further showing is queued for this page lifetime (never re-armed by route changes). */
  private done = false;
  private readonly now: () => number;
  private readonly setT: (fn: () => void, ms: number) => unknown;
  private readonly clearT: (handle: unknown) => void;

  constructor(
    private readonly cfg: ResolvedPopupRuntime,
    private readonly deps: ControllerDeps
  ) {
    this.now = deps.now ?? (() => Date.now());
    this.setT = deps.setTimeout ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearT = deps.clearTimeout ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  }

  get state(): ControllerState {
    return this._state;
  }

  /** ms epoch at which the popup will close by itself (while open). */
  get closesAt(): number | null {
    if (this._state !== "open") return null;
    const auto = this.cfg.autoCloseMs ?? Infinity;
    return this.openedAt + Math.min(auto, this.cfg.maxDisplayMs);
  }

  /** True while early dismissal is disabled and the popup hasn't closed yet. */
  get dismissLocked(): boolean {
    return this._state === "open" && !this.cfg.allowEarlyDismiss;
  }

  /** Begin the lifecycle. Idempotent — a second call (StrictMode) is a no-op. */
  start(routeAllowed = true): void {
    if (this._state !== "idle") return;
    this.routeAllowed = routeAllowed;
    this._state = "closed"; // evaluate() moves it to pending if eligible
    if (routeAllowed) this.evaluate(this.cfg.initialDelayMs);
  }

  /**
   * Tell the controller whether the current route may show a popup. Only a
   * CHANGE does anything, so calling this on every render is harmless.
   */
  setRouteAllowed(allowed: boolean): void {
    if (this._state === "destroyed" || allowed === this.routeAllowed) return;
    this.routeAllowed = allowed;
    if (!allowed) {
      if (this._state === "pending") {
        this.clearPending();
        this._state = "closed";
      } else if (this._state === "open") {
        this.close("route");
      }
    } else if (this._state === "closed" && !this.done) {
      this.evaluate(this.cfg.initialDelayMs);
    }
  }

  /**
   * A visitor attempt to dismiss. Returns whether it was honoured — false
   * when that channel is disabled by config or the popup is still locked.
   */
  dismiss(via: DismissAttempt): boolean {
    if (this._state !== "open") return false;
    if (this.dismissLocked) return false;
    if (via === "escape" && !this.cfg.escapeDismissEnabled) return false;
    if (via === "backdrop" && !this.cfg.backdropDismissEnabled) return false;
    this.close(via);
    return true;
  }

  destroy(): void {
    this.clearPending();
    this.clearOpenTimers();
    this._state = "destroyed";
  }

  // ---- internals ----

  /**
   * Decide whether (and when) to show next. `baseDelayMs` is the wait that
   * applies regardless of history (initial delay or repeat interval); the
   * minimum-reappearance gap and any WAIT_INTERVAL deadline can only push it
   * later, never earlier.
   */
  private evaluate(baseDelayMs: number): void {
    this.clearPending();
    if (this._state === "destroyed" || !this.routeAllowed) return;

    const s = this.deps.store.read();
    const t = this.now();
    if (s.suppressed || s.shown >= this.cfg.sessionDisplayLimit) {
      this._state = "closed";
      return;
    }

    let delay = Math.max(0, baseDelayMs);
    if (s.lastClosedAt > 0) {
      delay = Math.max(delay, s.lastClosedAt + this.cfg.minReappearanceMs - t);
    }
    if (s.waitUntil > t) delay = Math.max(delay, s.waitUntil - t);

    this._state = "pending";
    this.pendingTimer = this.setT(() => {
      this.pendingTimer = null;
      this.open();
    }, delay);
  }

  private open(): void {
    if (this._state !== "pending" || !this.routeAllowed) return;
    const t = this.now();
    this.openedAt = t;
    this._state = "open";
    const s = this.deps.store.read();
    this.deps.store.write({ shown: s.shown + 1 });

    const closeIn = Math.min(this.cfg.autoCloseMs ?? Infinity, this.cfg.maxDisplayMs);
    // Auto-close, when configured and within the ceiling.
    if (this.cfg.autoCloseMs !== null && this.cfg.autoCloseMs <= this.cfg.maxDisplayMs) {
      this.autoCloseTimer = this.setT(() => this.close("auto"), this.cfg.autoCloseMs);
    }
    // The ceiling is armed regardless: no configuration can outlive it.
    this.maxTimer = this.setT(() => this.close("max-duration"), this.cfg.maxDisplayMs);

    this.deps.onOpen?.({ openedAt: t, closesAt: t + closeIn });
  }

  private close(reason: CloseReason): void {
    if (this._state !== "open") return;
    this.clearOpenTimers();
    this._state = "closed";
    const t = this.now();
    const patch: Partial<PopupStoredState> = { lastClosedAt: t };

    const manual = reason === "manual" || reason === "backdrop" || reason === "escape";
    let repeat = this.cfg.repeatIntervalMs;
    if (manual) {
      if (this.cfg.dismissalPolicy === "SESSION_SUPPRESS") {
        patch.suppressed = true;
      } else if (this.cfg.dismissalPolicy === "WAIT_INTERVAL") {
        patch.waitUntil = t + this.cfg.dismissalWaitMs;
      }
    }
    this.deps.store.write(patch);
    this.deps.onClose?.(reason);

    // Anything that closed it cancels what was pending (nothing is — we were
    // open), then the repeat rules decide if another showing is queued.
    if (repeat > 0 && reason !== "route") {
      repeat = Math.max(repeat, this.cfg.minReappearanceMs);
      this.evaluate(repeat);
    } else {
      this.done = true;
    }
  }

  private clearPending(): void {
    if (this.pendingTimer !== null) {
      this.clearT(this.pendingTimer);
      this.pendingTimer = null;
    }
  }

  private clearOpenTimers(): void {
    if (this.autoCloseTimer !== null) this.clearT(this.autoCloseTimer);
    if (this.maxTimer !== null) this.clearT(this.maxTimer);
    this.autoCloseTimer = null;
    this.maxTimer = null;
  }
}
