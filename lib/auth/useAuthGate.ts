"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function useAuthGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUser();

  function guard(action: () => void) {
    if (isLoading) return;
    if (user) {
      action();
      return;
    }
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  return { guard, isAuthenticated: Boolean(user), isLoading };
}
