"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCart, IconHeart, IconHome, IconUser } from "../ui/icons";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { getAccountHref } from "@/lib/auth/getAccountHref";

import { isNavLinkActive } from "./nav-links";

const BASE_TABS = [
  { label: "Home", href: "/", Icon: IconHome },
  { label: "Shop", href: "/products", Icon: IconCart },
  { label: "Wishlist", href: "/wishlist", Icon: IconHeart },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();

  const accountTab = {
    label: "Account",
    href: getAccountHref(user),
    Icon: IconUser,
  };
  const tabs = [...BASE_TABS, accountTab];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Quick navigation"
    >
      {/* Four equal columns; the row is capped on tablets so items stay clustered, not spread across the screen */}
      <div className="mx-auto grid max-w-lg grid-cols-4 px-1">
        {tabs.map(({ label, href, Icon }) => (
          <Link
            key={label}
            href={href}
            aria-current={isNavLinkActive(pathname, href) ? "page" : undefined}
            className={`flex h-[4.25rem] min-w-0 flex-col items-center justify-center gap-1.5 border-t-2 px-1 transition-colors active:text-brand ${isNavLinkActive(pathname, href) ? "border-brand text-brand-dark" : "border-transparent text-ink-muted"}`}
          >
            <Icon className="h-6 w-6 shrink-0" />
            <span className="max-w-full truncate text-xs font-semibold leading-none">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
