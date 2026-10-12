import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markNotificationsRead, type NotificationsResult } from "../api/notification";
import { notificationKeys } from "./query-keys";
import { useCurrentUser } from "./useCurrentUser";

// Customers only (admins have their own notification surface). No polling:
// fetched on load, then only when the customer opens the bell - an order
// status changes at most a few times a day, so a timer would be pure cost.
export function useCustomerNotifications() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: fetchNotifications,
    enabled: Boolean(user) && user?.role !== "admin",
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    // Clear the badge in the cache; the items keep their "new" dots until the
    // list is next fetched, so what the customer is reading doesn't flicker.
    onSuccess: () =>
      queryClient.setQueryData<NotificationsResult>(notificationKeys.all, (data) =>
        data ? { ...data, unreadCount: 0 } : data
      ),
  });
}
