import type { AuthUser } from "../api/auth";

// Single place deciding where the "Account" icon/link points, shared by
// Header, MobileMenu, and MobileTabBar so the three don't drift out of sync.
export function getAccountHref(user: AuthUser | null | undefined): string {
  if (!user) return "/login";
  return user.role === "admin" ? "/admin" : "/profile";
}
