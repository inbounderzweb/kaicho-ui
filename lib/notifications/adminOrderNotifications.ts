import type { Socket } from "socket.io-client";

export interface AdminOrderNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  itemsCount: number;
  createdAt: string;
  confirmedAt?: string;
  unread?: boolean;
}

export interface AdminOrderFeed {
  items: AdminOrderNotification[];
  unreadCount: number;
}

interface Options {
  socket: Socket;
  fetchFeed: () => Promise<AdminOrderFeed>;
  fetchTicket: () => Promise<{ token: string }>;
  markRead: (orderIds: string[]) => Promise<unknown>;
  isAuthError: (error: unknown) => boolean;
  onFeed: (feed: AdminOrderFeed) => void;
  onNewOrders: (orders: AdminOrderNotification[]) => void;
  onError: (error: unknown | null) => void;
}

// Keep the socket as the fast path and reconcile against durable history on
// polling/reconnect. This also works when a proxy blocks WebSocket upgrades,
// or another API worker receives the checkout and has a different socket room.
export function watchAdminOrderNotifications(options: Options) {
  const { socket } = options;
  let disposed = false;
  let fetching = false;
  let refreshPending = false;
  let revision = 0;
  let readsInFlight = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let feed: AdminOrderFeed = { items: [], unreadCount: 0 };
  const observed = new Set<string>();

  const observe = (items: AdminOrderNotification[]) => {
    const fresh = items.filter((item) => !observed.has(item.orderId) && item.unread !== false);
    for (const item of items) observed.add(item.orderId);
    if (fresh.length) options.onNewOrders(fresh.slice(0, 3));
  };

  const refresh = async () => {
    if (disposed) return;
    refreshPending = true;
    if (fetching || readsInFlight) return;
    fetching = true;
    try {
      while (refreshPending && !disposed && !readsInFlight) {
        refreshPending = false;
        const requestRevision = revision;
        try {
          const snapshot = await options.fetchFeed();
          if (disposed) return;
          // A socket event/read happened while this request was in flight.
          // Never replace newer local state with an older HTTP response.
          if (requestRevision !== revision) {
            refreshPending = true;
            continue;
          }
          feed = { ...snapshot, items: snapshot.items.map((item) => ({ ...item, id: item.orderId })) };
          observe(feed.items);
          options.onFeed(feed);
          options.onError(null);
        } catch (error) {
          if (!disposed) options.onError(error);
          // The interval/online/focus handlers retry; never spin on an outage.
          refreshPending = false;
        }
      }
    } finally {
      fetching = false;
    }
  };

  const connect = async () => {
    if (disposed) return;
    try {
      const { token } = await options.fetchTicket();
      if (disposed) return;
      socket.auth = { token };
      socket.connect();
    } catch (error) {
      if (!disposed && !options.isAuthError(error)) retry();
    }
  };
  const retry = () => {
    if (disposed) return;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => { void connect(); }, 5000);
  };

  socket.io.reconnection(false);
  socket.on("connect_error", retry);
  socket.on("disconnect", retry);
  socket.on("connect", () => { void refresh(); });
  socket.on("order:new", (payload: Omit<AdminOrderNotification, "id" | "unread">) => {
    if (disposed || observed.has(payload.orderId)) return;
    revision += 1;
    const entry = { ...payload, id: payload.orderId, unread: true };
    observe([entry]);
    const items = [entry, ...feed.items].slice(0, 20);
    feed = { items, unreadCount: items.filter((item) => item.unread !== false).length };
    options.onFeed(feed);
    void refresh();
  });

  const interval = setInterval(() => { void refresh(); }, 15_000);
  void refresh();
  void connect();

  return {
    refresh,
    markAllRead() {
      const orderIds = feed.items.filter((item) => item.unread !== false).map((item) => item.orderId);
      if (!orderIds.length || disposed) return;
      revision += 1;
      readsInFlight += 1;
      feed = { ...feed, items: feed.items.map((item) => ({ ...item, unread: false })), unreadCount: 0 };
      options.onFeed(feed);
      void options.markRead(orderIds).catch((error) => {
        if (disposed) return;
        // Restore the failed operation even if the following GET also fails.
        // Only restore its IDs; concurrent arrivals/other reads keep their state.
        const restored = new Set(orderIds);
        const items = feed.items.map((item) => restored.has(item.orderId) ? { ...item, unread: true } : item);
        feed = { items, unreadCount: items.filter((item) => item.unread !== false).length };
        options.onFeed(feed);
        options.onError(error);
      }).finally(() => {
        readsInFlight -= 1;
        if (!disposed) void refresh();
      });
    },
    dispose() {
      disposed = true;
      clearInterval(interval);
      clearTimeout(retryTimer);
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}
