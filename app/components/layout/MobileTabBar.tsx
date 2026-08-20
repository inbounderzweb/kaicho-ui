"use client";

import Link from "next/link";
import { IconCart, IconHeart, IconHome, IconUser } from "../ui/icons";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { getAccountHref } from "@/lib/auth/getAccountHref";

const BASE_TABS = [
  { label: "Home", href: "/", Icon: IconHome },
  { label: "Shop", href: "/products", Icon: IconCart },
  { label: "Wishlist", href: "/wishlist", Icon: IconHeart },
];

export default function MobileTabBar() {
  const { data: user } = useCurrentUser();
  const accountTab = {
    label: "Account",
    href: getAccountHref(user),
    Icon: IconUser,
  };
  const tabs = [...BASE_TABS, accountTab];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Quick navigation"
    >
      {tabs.map(({ label, href, Icon }) => (
        <Link
          key={label}
          href={href}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-ink-muted transition-colors active:text-brand"
        >
          <Icon className="h-5 w-5" />
          <span className="text-[11px] font-semibold">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
