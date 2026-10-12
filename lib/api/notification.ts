import { apiFetch } from "./client";

// Backed by kaicho-be's /api/notifications (requireAuth): the customer's own
// order-status updates, derived from their orders' history.
export interface CustomerNotification {
  id: string;
  orderNumber: string;
  status: string;
  message: string;
  at: string;
  unread: boolean;
  tracking?: { carrier: string; trackingNumber: string };
}

export interface NotificationsResult {
  items: CustomerNotification[];
  unreadCount: number;
}

export function fetchNotifications(): Promise<NotificationsResult> {
  return apiFetch<NotificationsResult>("/notifications", { method: "GET" });
}

export function markNotificationsRead(): Promise<{ read: boolean }> {
  return apiFetch<{ read: boolean }>("/notifications/read", { method: "POST" });
}
