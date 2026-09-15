"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAdminOrderNotifications, type AdminOrderNotification } from "@/lib/hooks/admin/useAdminOrderNotifications";
import { IconBell } from "../ui/icons";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const TOAST_LIFETIME_MS = 6000;

// Bell + dropdown (persistent, in the top bar) and an auto-dismissing toast
// stack (transient, top-right overlay) sharing one socket connection via
// useAdminOrderNotifications. Mounted once in AdminShell so it's alive on
// every /admin/** page, matching the shell's own "gate the whole section
// once" approach.
export default function AdminOrderNotifications({ enabled }: { enabled: boolean }) {
  const { notifications, toasts, unreadCount, dismissToast, markAllRead } = useAdminOrderNotifications(enabled);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            markAllRead();
          }}
          aria-label="New order notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-admin-border transition-colors hover:bg-admin-primary/20 dark:border-admin-border-dark dark:hover:bg-admin-primary/10"
        >
          <IconBell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-admin-border bg-admin-card shadow-lg dark:border-admin-border-dark dark:bg-admin-card-dark">
            <div className="border-b border-admin-border px-4 py-3 text-sm font-semibold dark:border-admin-border-dark">
              New orders
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-black/50 dark:text-white/50">
                  No new orders yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={`/admin/orders/${n.orderId}`}
                    onClick={() => setOpen(false)}
                    className="block border-b border-admin-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-admin-primary/10 dark:border-admin-border-dark"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{n.orderNumber}</span>
                      <span className="text-black/60 dark:text-white/60">{currency.format(n.amount)}</span>
                    </div>
                    <p className="mt-0.5 text-black/60 dark:text-white/60">
                      {n.customerName} · {n.itemsCount} item{n.itemsCount === 1 ? "" : "s"}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: AdminOrderNotification[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <OrderToast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function OrderToast({ toast, onDismiss }: { toast: AdminOrderNotification; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <Link
      href={`/admin/orders/${toast.orderId}`}
      onClick={() => onDismiss(toast.id)}
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-admin-border bg-admin-card p-4 shadow-xl transition-transform hover:-translate-y-0.5 dark:border-admin-border-dark dark:bg-admin-card-dark"
    >
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-primary/20 text-admin-primary-dark dark:text-admin-primary">
        <IconBell className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">New order {toast.orderNumber}</span>
        <span className="mt-0.5 block truncate text-xs text-black/60 dark:text-white/60">
          {toast.customerName} · {currency.format(toast.amount)}
        </span>
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        aria-label="Dismiss"
        className="pointer-events-auto shrink-0 text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
      >
        ×
      </button>
    </Link>
  );
}
