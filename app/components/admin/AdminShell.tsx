"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { useLogout } from "@/lib/hooks/useLogout";
import { useAdminTheme } from "@/lib/hooks/admin/useAdminTheme";
import { IconMenu, IconLogout, IconEye, IconSun, IconMoon } from "../ui/icons";
import AdminNavLinks from "./AdminNavLinks";
import AdminDrawer from "./AdminDrawer";

/**
 * Shell for every /admin/** page: gates the whole section behind a single
 * useRequireAuth(["admin"]) call (not one per page), then renders the
 * persistent desktop sidebar / mobile drawer + top bar around {children}.
 * This is UX-only, same as useRequireAuth's own doc-comment says — the
 * real enforcement is requireAuth + requireRole("admin") on every
 * /api/admin/** endpoint, which run regardless of whether this ever mounts.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, authState, refetch } = useRequireAuth(["admin"]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { theme, toggleTheme } = useAdminTheme();

  if (authState === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-admin-surface dark:bg-admin-surface-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-admin-primary-dark/40 border-t-admin-primary-dark dark:border-admin-primary/30 dark:border-t-admin-primary" />
      </div>
    );
  }

  if (authState === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-admin-surface px-6 text-center dark:bg-admin-surface-dark">
        <p className="text-sm font-semibold text-black dark:text-white">
          Couldn&apos;t load the admin panel.
        </p>
        <p className="max-w-sm text-sm text-black/60 dark:text-white/60">
          This looks like a connection problem, not a sign-out. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-1 rounded-full bg-admin-primary px-5 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (authState !== "authenticated" || !user) {
    // useRequireAuth's effect is already redirecting (to /login or /) —
    // render nothing rather than a flash of admin chrome in the meantime.
    return <div className="min-h-dvh bg-admin-surface dark:bg-admin-surface-dark" />;
  }

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => router.push("/login") });
  };

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.phone;

  return (
    <div className="flex min-h-dvh bg-admin-surface text-black dark:bg-admin-surface-dark dark:text-white">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-admin-border bg-admin-card dark:border-admin-border-dark dark:bg-admin-card-dark lg:flex">
        <div className="flex h-16 items-center border-b border-admin-border px-5 dark:border-admin-border-dark">
          <Link href="/admin" className="font-display text-base font-bold">
            Kaicho Admin
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <AdminNavLinks pathname={pathname ?? "/admin"} />
        </div>
      </aside>

      <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} pathname={pathname ?? "/admin"} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-admin-border bg-admin-card px-4 dark:border-admin-border-dark dark:bg-admin-card-dark lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-admin-primary/20 dark:hover:bg-admin-primary/10 lg:hidden"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <span className="font-display text-sm font-bold lg:hidden">Kaicho Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-black/70 dark:text-white/70 sm:inline">
              {displayName}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-admin-border transition-colors hover:bg-admin-primary/20 dark:border-admin-border-dark dark:hover:bg-admin-primary/10"
            >
              {theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View site"
              title="Open the customer-facing site in a new tab"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-admin-border px-3 text-xs font-semibold transition-colors hover:bg-admin-primary/20 dark:border-admin-border-dark dark:hover:bg-admin-primary/10"
            >
              <IconEye className="h-4 w-4" />
              <span className="hidden sm:inline">View Site</span>
            </a>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              aria-label="Log out"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-admin-border px-3 text-xs font-semibold transition-colors hover:bg-admin-primary/20 disabled:opacity-50 dark:border-admin-border-dark dark:hover:bg-admin-primary/10"
            >
              <IconLogout className="h-4 w-4" />
              <span className="hidden sm:inline">{logout.isPending ? "Logging out…" : "Log out"}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
