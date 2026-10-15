import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Socket } from "socket.io-client";
import { watchAdminOrderNotifications, type AdminOrderFeed, type AdminOrderNotification } from "../adminOrderNotifications";

const at = (second: number) => `2026-10-15T10:00:${String(second).padStart(2, "0")}.000Z`;
const order = (id: string, second = 1, unread = true): AdminOrderNotification => ({
  id, orderId: id, orderNumber: `ORD-${id}`, customerName: "Customer", amount: 500,
  itemsCount: 1, createdAt: "2026-10-01T10:00:00.000Z", confirmedAt: at(second), unread,
});
const feed = (items: AdminOrderNotification[]): AdminOrderFeed => ({
  items, unreadCount: items.filter((item) => item.unread).length,
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
function harness(initial: AdminOrderFeed | Promise<AdminOrderFeed> = feed([])) {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const socket = {
    io: { reconnection: vi.fn() }, auth: {},
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => { listeners.set(event, handler); }),
    connect: vi.fn(), disconnect: vi.fn(), removeAllListeners: vi.fn(() => listeners.clear()),
  };
  const options = {
    socket: socket as unknown as Socket,
    fetchFeed: vi.fn<() => Promise<AdminOrderFeed>>().mockResolvedValue(feed([])).mockReturnValueOnce(Promise.resolve(initial)),
    fetchTicket: vi.fn().mockResolvedValue({ token: "ticket-1" }),
    markRead: vi.fn().mockResolvedValue({ read: true }),
    isAuthError: (error: unknown) => error === "unauthorized",
    onFeed: vi.fn<(snapshot: AdminOrderFeed) => void>(),
    onNewOrders: vi.fn<(orders: AdminOrderNotification[]) => void>(), onError: vi.fn(),
  };
  const watcher = watchAdminOrderNotifications(options);
  disposers.push(watcher.dispose);
  return { options, watcher, socket, emit: (event: string, payload?: unknown) => listeners.get(event)?.(payload) };
}
let disposers: (() => void)[];
const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };
beforeEach(() => { vi.useFakeTimers(); disposers = []; });
afterEach(() => { disposers.forEach((dispose) => dispose()); vi.useRealTimers(); });

describe("admin new-order delivery", () => {
  it("recovers a missed order through polling when the websocket cannot connect", async () => {
    const h = harness();
    await flush();
    h.emit("connect_error");
    h.options.fetchFeed.mockResolvedValue(feed([order("A")]));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(h.options.onFeed).toHaveBeenLastCalledWith(feed([order("A")]));
    expect(h.options.onNewOrders).toHaveBeenCalledExactlyOnceWith([order("A")]);
    expect(h.options.fetchTicket).toHaveBeenCalledTimes(2);
  });

  it("restores unread offline orders on mount and does not alert for already read history", async () => {
    const h = harness(feed([order("A")]));
    await flush();
    expect(h.options.onNewOrders).toHaveBeenCalledExactlyOnceWith([order("A")]);
    h.watcher.dispose();
    const next = harness(feed([order("A", 1, false)]));
    await flush();
    expect(next.options.onFeed).toHaveBeenLastCalledWith(feed([order("A", 1, false)]));
    expect(next.options.onNewOrders).not.toHaveBeenCalled();
  });

  it("deduplicates repeated socket events and the same order in the durable feed", async () => {
    const h = harness();
    await flush();
    h.options.fetchFeed.mockResolvedValue(feed([order("A")]));
    h.emit("order:new", order("A"));
    h.emit("order:new", order("A"));
    await flush();
    await h.watcher.refresh();
    expect(h.options.onNewOrders).toHaveBeenCalledExactlyOnceWith([order("A")]);
    expect(h.options.onFeed.mock.lastCall?.[0].unreadCount).toBe(1);
    expect(h.options.onFeed.mock.lastCall?.[0].items).toHaveLength(1);
  });

  it("discards an HTTP snapshot that predates a socket arrival", async () => {
    const first = deferred<AdminOrderFeed>();
    const h = harness(first.promise);
    h.options.fetchFeed.mockResolvedValue(feed([order("A")]));
    h.emit("order:new", order("A"));
    first.resolve(feed([]));
    await flush();
    expect(h.options.onFeed.mock.calls.every(([snapshot]) => snapshot.items.some((item) => item.orderId === "A"))).toBe(true);
    expect(h.options.fetchFeed).toHaveBeenCalledTimes(2);
  });

  it("acknowledges displayed order IDs and leaves an order arriving during mark-read unread", async () => {
    const h = harness(feed([order("A")]));
    await flush();
    const read = deferred<{ read: boolean }>();
    h.options.markRead.mockReturnValueOnce(read.promise);
    h.watcher.markAllRead();
    expect(h.options.markRead).toHaveBeenCalledExactlyOnceWith(["A"]);
    h.emit("order:new", order("B", 11));
    expect(h.options.onFeed.mock.lastCall?.[0].unreadCount).toBe(1);
    h.options.fetchFeed.mockResolvedValue(feed([order("B", 11), order("A", 1, false)]));
    read.resolve({ read: true });
    await flush();
    expect(h.options.onFeed).toHaveBeenLastCalledWith(feed([order("B", 11), order("A", 1, false)]));
    expect(h.options.onNewOrders).toHaveBeenCalledTimes(2);
  });

  it("acknowledges a socket order even before its HTTP feed response arrives", async () => {
    const h = harness();
    await flush();
    h.options.fetchFeed.mockReturnValue(new Promise(() => {}));
    h.emit("order:new", order("A", 11));
    h.watcher.markAllRead();
    expect(h.options.markRead).toHaveBeenCalledWith(["A"]);
  });

  it("restores unread state after a mark-read failure without a duplicate alert", async () => {
    const h = harness(feed([order("A")]));
    await flush();
    h.options.fetchFeed.mockResolvedValue(feed([order("A")]));
    h.options.markRead.mockRejectedValueOnce(new Error("offline"));
    h.watcher.markAllRead();
    await flush();
    expect(h.options.onFeed.mock.lastCall?.[0].unreadCount).toBe(1);
    expect(h.options.onNewOrders).toHaveBeenCalledTimes(1);
  });

  it("rolls back failed reads even when the recovery GET fails, retaining concurrent orders", async () => {
    const h = harness(feed([order("A")]));
    await flush();
    const read = deferred<{ read: boolean }>();
    h.options.markRead.mockReturnValueOnce(read.promise);
    h.options.fetchFeed.mockRejectedValue(new Error("offline"));
    h.watcher.markAllRead();
    h.emit("order:new", order("B"));
    read.reject(new Error("offline"));
    await flush();
    expect(h.options.onFeed).toHaveBeenLastCalledWith(feed([order("B"), order("A")]));
    expect(h.options.onNewOrders).toHaveBeenCalledTimes(2);
    expect(h.options.onError.mock.lastCall?.[0]).toBeInstanceOf(Error);
  });

  it("keeps a second successful acknowledgement when an overlapping read fails offline", async () => {
    const h = harness(feed([order("A")]));
    await flush();
    const first = deferred<{ read: boolean }>();
    const second = deferred<{ read: boolean }>();
    h.options.markRead.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    h.options.fetchFeed.mockRejectedValue(new Error("offline"));
    h.watcher.markAllRead();
    h.emit("order:new", order("B"));
    h.watcher.markAllRead();
    first.reject(new Error("offline"));
    second.resolve({ read: true });
    await flush();
    expect(h.options.markRead.mock.calls).toEqual([[["A"]], [["B"]]]);
    expect(h.options.onFeed).toHaveBeenLastCalledWith(feed([order("B", 1, false), order("A")]));
  });

  it("keeps the badge bounded to displayed notifications after a socket arrival", async () => {
    const h = harness(feed(Array.from({ length: 20 }, (_, index) => order(String(index)))));
    await flush();
    h.options.fetchFeed.mockRejectedValue(new Error("offline"));
    h.emit("order:new", order("new"));
    await flush();
    expect(h.options.onFeed.mock.lastCall?.[0].items).toHaveLength(20);
    expect(h.options.onFeed.mock.lastCall?.[0].unreadCount).toBe(20);
  });

  it("refreshes on reconnect and fetches a fresh socket ticket after disconnect", async () => {
    const h = harness();
    await flush();
    h.options.fetchTicket.mockResolvedValue({ token: "ticket-2" });
    h.emit("disconnect");
    await vi.advanceTimersByTimeAsync(5000);
    expect(h.socket.auth).toEqual({ token: "ticket-2" });
    h.options.fetchFeed.mockResolvedValue(feed([order("A")]));
    h.emit("connect");
    await flush();
    expect(h.options.onFeed).toHaveBeenLastCalledWith(feed([order("A")]));
  });

  it("cleans up retries, polling, and pending requests when the admin shell unmounts", async () => {
    const first = deferred<AdminOrderFeed>();
    const h = harness(first.promise);
    await flush();
    h.emit("connect_error");
    h.watcher.dispose();
    first.resolve(feed([order("A")]));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(h.options.onFeed).not.toHaveBeenCalled();
    expect(h.options.onNewOrders).not.toHaveBeenCalled();
    expect(h.options.fetchTicket).toHaveBeenCalledTimes(1);
    expect(h.options.fetchFeed).toHaveBeenCalledTimes(1);
  });
});
