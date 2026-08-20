"use client";

import { useEffect, useRef } from "react";
import { IconClose } from "../ui/icons";
import AdminNavLinks from "./AdminNavLinks";

/**
 * Mobile/tablet nav drawer for the admin panel (below lg — the desktop
 * sidebar takes over at lg). Same interaction contract as the storefront's
 * MobileMenu.tsx (focus on open, Escape to close, backdrop click to close,
 * body-scroll lock) — reused here rather than reinvented, mirrored instead
 * of imported since it slides from the left and carries admin-only nav.
 */
export default function AdminDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        tabIndex={-1}
        className={`absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-admin-card shadow-2xl transition-transform duration-300 ease-out dark:bg-admin-card-dark ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-admin-border px-4 dark:border-admin-border-dark">
          <span className="font-display text-base font-bold text-black dark:text-white">
            Kaicho Admin
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-black/70 hover:bg-admin-primary/20 hover:text-black dark:text-white/70 dark:hover:bg-admin-primary/10 dark:hover:text-white"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <AdminNavLinks pathname={pathname} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
