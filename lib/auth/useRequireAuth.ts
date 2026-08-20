"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { UserRole } from "../api/auth";

export type AuthState = "loading" | "authenticated" | "unauthenticated" | "error";

/**
 * Gates the calling page behind authentication (and optionally a role).
 * Not logged in -> redirect to /login?redirect=<current path>.
 * Logged in but wrong role -> redirect to /.
 * Backend unreachable / errored -> neither: exposed as authState "error" so
 * the caller can show a retry state instead of being redirected away from a
 * page they were legitimately allowed to see, just because the network or
 * the backend hiccuped.
 * This is UX only: the real enforcement is the backend endpoint(s) the
 * page's data calls hit (requireAuth / requireRole), which run regardless
 * of whether this hook was ever called.
 */
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError, refetch } = useCurrentUser();

  const authState: AuthState = isLoading
    ? "loading"
    : isError
      ? "error"
      : user
        ? "authenticated"
        : "unauthenticated";

  const isAuthorized = Boolean(
    authState === "authenticated" &&
      user &&
      (!allowedRoles || allowedRoles.includes(user.role))
  );

  useEffect(() => {
    if (authState === "loading" || authState === "error") return;
    if (authState === "unauthenticated") {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [authState, user, allowedRoles, router, pathname]);

  return { user, isLoading, isAuthorized, authState, refetch };
}
