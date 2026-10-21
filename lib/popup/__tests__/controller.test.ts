import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PopupController, createMemoryStore, type CloseReason } from "../controller";
import { resolvePopupRuntime, isPopupAllowedOnPath, describeVisibleDuration } from "../timing";
import type { PublicPopup, PopupTimingSettings } from "../../api/popup";

const set = (over: Partial<PopupTimingSettings> = {}): PopupTimingSettings => ({
  initialDelaySeconds: 3,
  autoCloseEnabled: true,
  autoCloseAfterSeconds: 10,
  countdownVisible: false,
  closeButtonEnabled: true,
  closeButtonPosition: "TOP_RIGHT",
  backdropDismissEnabled: true,
  escapeDismissEnabled: true,
  ...over,
});

function popup(over: {
  shared?: Partial<PopupTimingSettings>;
  desktop?: Partial<PopupTimingSettings>;
  mobile?: Partial<PopupTimingSettings>;
  useShared?: boolean;
  display?: Partial<PublicPopup["display"]>;
  devices?: Partial<PublicPopup["devices"]>;
} = {}): PublicPopup {
  return {
    id: "p1",
    revision: "r1",
    content: { heading: "Hi", body: "" },
    design: { theme: "LIGHT", size: "MD" },
    devices: {
      desktop: { enabled: true, placement: "CENTER" },
      mobile: { enabled: true, placement: "BOTTOM_SHEET" },
      ...over.devices,
    },
    timing: {
      useSharedTimingSettings: over.useShared ?? true,
      shared: set(over.shared),
      desktop: set(over.desktop),
      mobile: set(over.mobile),
    },
    display: {
      maxDisplaySeconds: 60,
      allowEarlyDismiss: true,
      closeButtonSize: "MD",
      closeButtonStyle: "SOLID",
      dismissalPolicy: "SESSION_SUPPRESS",
      dismissalWaitSeconds: 86400,
      sessionDisplayLimit: 1,
      repeatIntervalSeconds: 0,
      minReappearanceSeconds: 30,
      ...over.display,
    },
    countdown: { enabled: false, endsAt: null },
    targeting: { includePaths: [] },
  };
}

function make(p: PublicPopup, device: "desktop" | "mobile" = "desktop", storeInit = {}) {
  const rt = resolvePopupRuntime(p, device)!;
  const opens: number[] = [];
  const closes: CloseReason[] = [];
  const store = createMemoryStore(storeInit);
  const c = new PopupController(rt, {
    store,
    onOpen: () => opens.push(Date.now()),
    onClose: (r) => closes.push(r),
  });
  return { c, opens, closes, store, rt };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("initial delay (spec 6.1)", () => {
  it("opens after ~3s and not before", () => {
    const { c, opens } = make(popup());
    c.start();
    vi.advanceTimersByTime(2999);
    expect(opens).toHaveLength(0);
    expect(c.state).toBe("pending");
    vi.advanceTimersByTime(1);
    expect(opens).toHaveLength(1);
    expect(c.state).toBe("open");
  });

  it("0s delay opens immediately on the next tick", () => {
    const { c, opens } = make(popup({ shared: { initialDelaySeconds: 0 } }));
    c.start();
    vi.advanceTimersByTime(0);
    expect(opens).toHaveLength(1);
  });
});

describe("auto-close (spec 6.2, 6.3)", () => {
  it("closes ~10s after it OPENS (not after load)", () => {
    const { c, closes } = make(popup());
    c.start();
    vi.advanceTimersByTime(3000); // opens
    vi.advanceTimersByTime(9999);
    expect(c.state).toBe("open");
    vi.advanceTimersByTime(1);
    expect(closes).toEqual(["auto"]);
    expect(c.state).toBe("closed");
  });

  it("with auto-close disabled it stays open until the max-duration ceiling", () => {
    const { c, closes } = make(popup({ shared: { autoCloseEnabled: false }, display: { maxDisplaySeconds: 45 } }));
    c.start();
    vi.advanceTimersByTime(3000);
    vi.advanceTimersByTime(44_000);
    expect(c.state).toBe("open");
    vi.advanceTimersByTime(1000);
    expect(closes).toEqual(["max-duration"]);
  });

  it("ceiling wins when auto-close is configured longer than it (defensive clamp)", () => {
    const p = popup({ shared: { autoCloseAfterSeconds: 300 }, display: { maxDisplaySeconds: 20 } });
    const { c, closes } = make(p);
    c.start();
    vi.advanceTimersByTime(3000 + 20_000);
    expect(closes).toEqual(["auto"]); // clamped to 20s and reported as auto
    expect(c.state).toBe("closed");
  });

  it("countdown visibility is independent of auto-close", () => {
    const a = resolvePopupRuntime(popup({ shared: { autoCloseEnabled: false, countdownVisible: true } }), "desktop")!;
    expect(a.countdownVisible).toBe(true);
    expect(a.autoCloseMs).toBeNull();
    const b = resolvePopupRuntime(popup({ shared: { autoCloseEnabled: true, countdownVisible: false } }), "desktop")!;
    expect(b.countdownVisible).toBe(false);
    expect(b.autoCloseMs).toBe(10_000);
  });

  it("describes visible duration", () => {
    const rt = resolvePopupRuntime(popup({ shared: { autoCloseEnabled: false } }), "desktop")!;
    expect(describeVisibleDuration(rt)).toEqual({ seconds: 60, cappedByMax: true, viaAutoClose: false });
  });
});

describe("desktop vs mobile independence (spec 6.5)", () => {
  const p = popup({
    useShared: false,
    desktop: { initialDelaySeconds: 3, autoCloseAfterSeconds: 10 },
    mobile: { initialDelaySeconds: 8, autoCloseEnabled: false, closeButtonPosition: "TOP_LEFT" },
  });
  it("uses each device's own values", () => {
    const d = resolvePopupRuntime(p, "desktop")!;
    const m = resolvePopupRuntime(p, "mobile")!;
    expect(d.initialDelayMs).toBe(3000);
    expect(d.autoCloseMs).toBe(10_000);
    expect(m.initialDelayMs).toBe(8000);
    expect(m.autoCloseMs).toBeNull();
    expect(m.closeButtonPosition).toBe("TOP_LEFT");
  });
  it("shared mode ignores per-device values", () => {
    const shared = popup({ useShared: true, shared: { initialDelaySeconds: 5 }, mobile: { initialDelaySeconds: 99 } });
    expect(resolvePopupRuntime(shared, "mobile")!.initialDelayMs).toBe(5000);
  });
  it("returns null for a disabled device", () => {
    const off = popup({ devices: { mobile: { enabled: false, placement: "CENTER" } } });
    expect(resolvePopupRuntime(off, "mobile")).toBeNull();
    expect(resolvePopupRuntime(off, "desktop")).not.toBeNull();
  });
  it("mobile opens at 8s while desktop opens at 3s", () => {
    const d = make(p, "desktop");
    const m = make(p, "mobile");
    d.c.start();
    m.c.start();
    vi.advanceTimersByTime(3000);
    expect(d.opens).toHaveLength(1);
    expect(m.opens).toHaveLength(0);
    vi.advanceTimersByTime(5000);
    expect(m.opens).toHaveLength(1);
  });
});

describe("manual dismissal (spec 6.6)", () => {
  it("cancels the auto-close + ceiling timers and does not reopen", () => {
    const { c, opens, closes } = make(popup());
    c.start();
    vi.advanceTimersByTime(3000);
    expect(c.dismiss("manual")).toBe(true);
    expect(closes).toEqual(["manual"]);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10 * 60_000);
    expect(opens).toHaveLength(1);
    expect(closes).toHaveLength(1); // auto-close did not fire a second close
  });

  it("dismissing while still pending is impossible (nothing to dismiss)", () => {
    const { c } = make(popup());
    c.start();
    expect(c.dismiss("manual")).toBe(false);
    expect(c.state).toBe("pending");
  });

  it("escape / backdrop honoured only when enabled", () => {
    const off = make(popup({ shared: { escapeDismissEnabled: false, backdropDismissEnabled: false } }));
    off.c.start();
    vi.advanceTimersByTime(3000);
    expect(off.c.dismiss("escape")).toBe(false);
    expect(off.c.dismiss("backdrop")).toBe(false);
    expect(off.c.state).toBe("open");
    expect(off.c.dismiss("manual")).toBe(true); // reliable fallback always works

    const on = make(popup());
    on.c.start();
    vi.advanceTimersByTime(3000);
    expect(on.c.dismiss("escape")).toBe(true);
    expect(on.closes).toEqual(["escape"]);
  });

  it("hidden close button + all channels off still can't trap: ceiling + manual fallback", () => {
    const p = popup({
      shared: { closeButtonEnabled: false, escapeDismissEnabled: false, backdropDismissEnabled: false, autoCloseEnabled: false },
      display: { maxDisplaySeconds: 30 },
    });
    const { c, closes } = make(p);
    c.start();
    vi.advanceTimersByTime(3000 + 30_000);
    expect(closes).toEqual(["max-duration"]);
  });

  it("early dismissal disabled: locked, auto-close forced and capped at 10s", () => {
    const p = popup({ shared: { autoCloseEnabled: false, autoCloseAfterSeconds: 200 }, display: { allowEarlyDismiss: false } });
    const { c, closes, rt } = make(p);
    expect(rt.autoCloseMs).toBe(10_000);
    c.start();
    vi.advanceTimersByTime(3000);
    expect(c.dismissLocked).toBe(true);
    expect(c.dismiss("manual")).toBe(false);
    expect(c.dismiss("escape")).toBe(false);
    vi.advanceTimersByTime(10_000);
    expect(closes).toEqual(["auto"]);
  });
});

describe("dismissal policies & frequency", () => {
  it("SESSION_SUPPRESS: manual dismissal blocks repeats this session", () => {
    const { c, opens, store } = make(popup({ display: { sessionDisplayLimit: 5, repeatIntervalSeconds: 60, dismissalPolicy: "SESSION_SUPPRESS" } }));
    c.start();
    vi.advanceTimersByTime(3000);
    c.dismiss("manual");
    expect(store.read().suppressed).toBe(true);
    vi.advanceTimersByTime(3_600_000);
    expect(opens).toHaveLength(1);
  });

  it("WAIT_INTERVAL: reopen only after the wait, even with repeats enabled", () => {
    const { c, opens } = make(
      popup({ display: { sessionDisplayLimit: 5, repeatIntervalSeconds: 60, dismissalPolicy: "WAIT_INTERVAL", dismissalWaitSeconds: 600 } })
    );
    c.start();
    vi.advanceTimersByTime(3000);
    c.dismiss("manual");
    vi.advanceTimersByTime(599_000);
    expect(opens).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(opens).toHaveLength(2);
  });

  it("FOLLOW_FREQUENCY: repeats on the interval up to the session limit", () => {
    const { c, opens } = make(
      popup({ display: { sessionDisplayLimit: 3, repeatIntervalSeconds: 60, dismissalPolicy: "FOLLOW_FREQUENCY" } })
    );
    c.start();
    vi.advanceTimersByTime(3000); // open #1
    c.dismiss("manual");
    vi.advanceTimersByTime(59_999);
    expect(opens).toHaveLength(1);
    vi.advanceTimersByTime(1); // open #2
    expect(opens).toHaveLength(2);
    c.dismiss("manual");
    vi.advanceTimersByTime(60_000); // open #3
    expect(opens).toHaveLength(3);
    c.dismiss("manual");
    vi.advanceTimersByTime(10 * 60_000);
    expect(opens).toHaveLength(3); // limit reached
  });

  it("minimum reappearance delay holds back a too-short repeat on reload", () => {
    // Closed 5s ago in this session; min gap is 30s; initial delay 3s.
    const store = { shown: 1, lastClosedAt: Date.now() - 5000 };
    const { c, opens } = make(popup({ display: { sessionDisplayLimit: 3, dismissalPolicy: "FOLLOW_FREQUENCY" } }), "desktop", store);
    c.start();
    vi.advanceTimersByTime(24_999);
    expect(opens).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(opens).toHaveLength(1);
  });

  it("session limit 1 + already shown → never schedules", () => {
    const { c, opens } = make(popup(), "desktop", { shown: 1 });
    c.start();
    expect(c.state).toBe("closed");
    vi.advanceTimersByTime(60_000);
    expect(opens).toHaveLength(0);
  });

  it("an active WAIT_INTERVAL deadline from a previous session delays the first show", () => {
    const { c, opens } = make(popup(), "desktop", { waitUntil: Date.now() + 120_000 });
    c.start();
    vi.advanceTimersByTime(119_999);
    expect(opens).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(opens).toHaveLength(1);
  });
});

describe("cleanup & re-render safety (spec 6.7, 6.8)", () => {
  it("destroy while pending clears the timer and never opens", () => {
    const { c, opens } = make(popup());
    c.start();
    c.destroy();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(opens).toHaveLength(0);
    expect(c.state).toBe("destroyed");
  });

  it("destroy while open clears auto-close + ceiling and emits no close", () => {
    const { c, closes } = make(popup());
    c.start();
    vi.advanceTimersByTime(3000);
    c.destroy();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(120_000);
    expect(closes).toHaveLength(0);
  });

  it("repeated start() calls neither restart the timer nor double-open", () => {
    const { c, opens } = make(popup());
    c.start();
    vi.advanceTimersByTime(2000);
    c.start();
    c.start();
    vi.advanceTimersByTime(1000); // original 3s deadline still holds
    expect(opens).toHaveLength(1);
    expect(vi.getTimerCount()).toBeLessThanOrEqual(2);
  });

  it("repeated setRouteAllowed(same) does not restart the pending timer", () => {
    const { c, opens } = make(popup());
    c.start(true);
    vi.advanceTimersByTime(2000);
    c.setRouteAllowed(true);
    c.setRouteAllowed(true);
    vi.advanceTimersByTime(1000);
    expect(opens).toHaveLength(1);
  });

  it("switching popups: destroying one controller and starting another leaves no stray timers", () => {
    const a = make(popup());
    a.c.start();
    a.c.destroy();
    const b = make({ ...popup(), id: "p2" });
    b.c.start();
    vi.advanceTimersByTime(3000);
    expect(a.opens).toHaveLength(0);
    expect(b.opens).toHaveLength(1);
  });
});

describe("route safety", () => {
  it("navigating to an excluded route while pending cancels the show", () => {
    const { c, opens } = make(popup());
    c.start(true);
    vi.advanceTimersByTime(1000);
    c.setRouteAllowed(false);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(opens).toHaveLength(0);
  });

  it("navigating into checkout while open closes it (reason: route) and it doesn't come back", () => {
    const { c, closes, opens } = make(popup({ display: { sessionDisplayLimit: 3, repeatIntervalSeconds: 60 } }));
    c.start(true);
    vi.advanceTimersByTime(3000);
    c.setRouteAllowed(false);
    expect(closes).toEqual(["route"]);
    c.setRouteAllowed(true);
    vi.advanceTimersByTime(10 * 60_000);
    expect(opens).toHaveLength(1);
  });

  it("returning to an allowed route restarts the pending delay", () => {
    const { c, opens } = make(popup());
    c.start(false);
    expect(c.state).toBe("closed");
    c.setRouteAllowed(true);
    vi.advanceTimersByTime(3000);
    expect(opens).toHaveLength(1);
  });

  it("path rules: excluded prefixes always win; include list narrows", () => {
    expect(isPopupAllowedOnPath("/", [])).toBe(true);
    expect(isPopupAllowedOnPath("/products/oats", [])).toBe(true);
    for (const p of ["/checkout", "/checkout/pay", "/cart", "/login", "/admin/popups", "/orders/123", "/payment/x"]) {
      expect(isPopupAllowedOnPath(p, [])).toBe(false);
      expect(isPopupAllowedOnPath(p, ["/"])).toBe(false);
    }
    expect(isPopupAllowedOnPath("/cartography", [])).toBe(true); // prefix match is segment-aware
    expect(isPopupAllowedOnPath("/blog/x", ["/blog"])).toBe(true);
    expect(isPopupAllowedOnPath("/products", ["/blog"])).toBe(false);
    expect(isPopupAllowedOnPath("/blog", ["/"])).toBe(false);
    expect(isPopupAllowedOnPath("/", ["/"])).toBe(true);
  });
});

describe("defensive clamping", () => {
  it("clamps out-of-range / NaN values from a stale or tampered response", () => {
    const p = popup({
      shared: { initialDelaySeconds: 99999, autoCloseAfterSeconds: -5 },
      display: { maxDisplaySeconds: 99999, sessionDisplayLimit: 0, minReappearanceSeconds: NaN },
    });
    const rt = resolvePopupRuntime(p, "desktop")!;
    expect(rt.initialDelayMs).toBe(300_000);
    expect(rt.autoCloseMs).toBe(3000);
    expect(rt.maxDisplayMs).toBe(600_000);
    expect(rt.sessionDisplayLimit).toBe(1);
    expect(rt.minReappearanceMs).toBe(30_000);
  });
});

describe("show on every load / login", () => {
  it("a refresh (new controller + fresh store) shows again even after a dismissal", () => {
    const p = popup({ display: { showOnEveryLoad: true } });
    expect(resolvePopupRuntime(p, "desktop")!.everyLoad).toBe(true);
    for (let load = 0; load < 3; load++) {
      const { c, opens } = make(p); // each load = fresh memory store, as StorefrontPopup does
      c.start();
      vi.advanceTimersByTime(3000);
      expect(opens).toHaveLength(1);
      c.dismiss("manual");
      c.destroy();
    }
  });

  it("is off by default, so a persisted session store still blocks a refresh", () => {
    expect(resolvePopupRuntime(popup(), "desktop")!.everyLoad).toBe(false);
    const { c, opens } = make(popup(), "desktop", { shown: 1 });
    c.start();
    vi.advanceTimersByTime(60_000);
    expect(opens).toHaveLength(0);
  });
});
