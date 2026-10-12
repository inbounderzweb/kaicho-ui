import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendInteractions = vi.fn();
vi.mock("../../api/interaction", () => ({ sendInteractions: (...a: unknown[]) => sendInteractions(...a) }));

import {
  recordInteraction,
  setTrackingEnabled,
  __resetTrackerForTests,
  __queuedForTests,
} from "../tracker";
import { forwardAnalyticsEvent } from "../bridge";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
  });
  vi.stubGlobal("document", { addEventListener: vi.fn(), visibilityState: "visible" });
  sendInteractions.mockReset();
  sendInteractions.mockResolvedValue({ tracking: "enabled", recorded: 1, duplicates: 0, rejected: 0 });
  __resetTrackerForTests();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const ID = "6aa38f1e1e0c37332a3d1916";

describe("interaction tracker", () => {
  it("records nothing until enabled", () => {
    recordInteraction({ type: "product_view", productId: ID });
    expect(__queuedForTests()).toHaveLength(0);
  });

  it("queues with server-compatible ids and flushes in one batch", () => {
    setTrackingEnabled(true);
    recordInteraction({ type: "product_view", productId: ID });
    recordInteraction({ type: "category_view", categoryId: ID });
    const [e] = __queuedForTests();
    expect(e.eventId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(e.sessionId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);

    vi.advanceTimersByTime(15_100);
    expect(sendInteractions).toHaveBeenCalledTimes(1);
    expect(sendInteractions.mock.calls[0][0]).toHaveLength(2);
  });

  it("drops a repeat of the same view within the dedupe window, even if another event came between", () => {
    setTrackingEnabled(true);
    recordInteraction({ type: "product_view", productId: ID });
    recordInteraction({ type: "category_view", categoryId: ID });
    recordInteraction({ type: "product_view", productId: ID });
    expect(__queuedForTests()).toHaveLength(2);
    vi.advanceTimersByTime(31_000);
    recordInteraction({ type: "product_view", productId: ID });
    expect(__queuedForTests().length).toBeGreaterThan(0);
  });

  it("sends one request per full batch, not one per event", () => {
    setTrackingEnabled(true);
    for (let i = 0; i < 20; i++) {
      recordInteraction({ type: "product_view", productId: `6aa38f1e1e0c37332a3d19${String(i).padStart(2, "0")}` });
    }
    expect(sendInteractions).toHaveBeenCalledTimes(1);
    expect(sendInteractions.mock.calls[0][0]).toHaveLength(20);
  });

  it("stops accepting events after the per-page-load cap", () => {
    setTrackingEnabled(true);
    for (let i = 0; i < 400; i++) {
      recordInteraction({ type: "search", query: `q${i}` });
    }
    const sent = sendInteractions.mock.calls.reduce((n, c) => n + (c[0] as unknown[]).length, 0);
    expect(sent + __queuedForTests().length).toBe(300);
  });

  it("discards the queue when switched off", () => {
    setTrackingEnabled(true);
    recordInteraction({ type: "product_view", productId: ID });
    setTrackingEnabled(false);
    vi.advanceTimersByTime(16_000);
    expect(sendInteractions).not.toHaveBeenCalled();
  });

  it("stops when the server reports tracking disabled, and never throws on failure", async () => {
    setTrackingEnabled(true);
    sendInteractions.mockResolvedValueOnce({ tracking: "disabled", recorded: 0, duplicates: 0, rejected: 0 });
    recordInteraction({ type: "product_view", productId: ID });
    vi.advanceTimersByTime(15_100);
    await Promise.resolve();
    await Promise.resolve();
    recordInteraction({ type: "category_view", categoryId: ID });
    expect(__queuedForTests()).toHaveLength(0);

    setTrackingEnabled(true);
    sendInteractions.mockRejectedValueOnce(new Error("network"));
    recordInteraction({ type: "product_view", productId: "6aa38f1e1e0c37332a3d1917" });
    expect(() => vi.advanceTimersByTime(4100)).not.toThrow();
  });
});

describe("analytics bridge", () => {
  it("maps standard events and ignores the rest", () => {
    setTrackingEnabled(true);
    const item = { item_id: ID, item_name: "x", price: 1, currency: "INR", quantity: 2 };
    forwardAnalyticsEvent({ name: "view_item", params: { currency: "INR", value: 1, items: [item] } });
    forwardAnalyticsEvent({ name: "add_to_cart", params: { currency: "INR", value: 2, items: [item] } });
    forwardAnalyticsEvent({ name: "page_view", params: { page_path: "/" } });
    forwardAnalyticsEvent({ name: "purchase", params: { transaction_id: "t", currency: "INR", value: 1, items: [item] } });
    const q = __queuedForTests();
    expect(q.map((e) => e.type)).toEqual(["product_view", "add_to_cart"]);
    expect(q[1].quantity).toBe(2);
    // begin_checkout is recorded by the server, not forwarded from the browser
    forwardAnalyticsEvent({ name: "begin_checkout", params: { currency: "INR", value: 1, items: [item] } });
    expect(__queuedForTests()).toHaveLength(2);
  });

  it("records only the settled search term", () => {
    setTrackingEnabled(true);
    for (const t of ["o", "oa", "oats"]) forwardAnalyticsEvent({ name: "search", params: { search_term: t } });
    vi.advanceTimersByTime(1600);
    const q = __queuedForTests();
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "search", query: "oats" });
  });
});
