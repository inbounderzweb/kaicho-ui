"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IconBell } from "../ui/icons";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useCustomerNotifications, useMarkNotificationsRead } from "@/lib/hooks/useCustomerNotifications";
import { notificationKeys } from "@/lib/hooks/query-keys";

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

// Order-update bell for signed-in customers. Opening it fetches the latest
// list once and marks everything read; there is no background polling.
export default function NotificationBell() {
  const { data: user } = useCurrentUser();
  const { data } = useCustomerNotifications();
  const markRead = useMarkNotificationsRead();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user || user.role === "admin") return null;

  const unread = data?.unreadCount ?? 0;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    // Refresh once on open, then mark read - one fetch, one write, user-initiated.
    await queryClient.refetchQueries({ queryKey: notificationKeys.all });
    markRead.mutate();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} new` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggle}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-brand-soft hover:text-brand"
      >
        <IconBell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Order updates"
          className="fixed inset-x-3 top-[78px] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        >
          <p className="border-b border-border px-4 py-3 text-sm font-bold text-ink">Order updates</p>
          {!data || data.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">
              No order updates yet. We&apos;ll let you know here when an order moves along.
            </p>
          ) : (
            <ul>
              {data.items.map((n) => (
                <li key={n.id} className="border-b border-border last:border-b-0">
                  <Link
                    href={`/orders/${encodeURIComponent(n.orderNumber)}`}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-brand-soft ${n.unread ? "bg-brand-soft/50" : ""}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? "bg-brand" : "bg-transparent"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink">
                        Order <strong>{n.orderNumber}</strong> {n.message}
                      </span>
                      {n.tracking && (
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {n.tracking.carrier} · {n.tracking.trackingNumber}
                        </span>
                      )}
                      <span className="mt-0.5 block text-xs text-ink-faint">{timeAgo(n.at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
