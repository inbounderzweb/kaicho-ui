"use client";

import Link from "next/link";
import { IconCart, IconHome, IconLeaf, IconUser } from "../ui/icons";

const TABS = [
  { label: "Home", href: "#home", Icon: IconHome },
  { label: "Shop", href: "#products", Icon: IconCart },
  { label: "About", href: "#story", Icon: IconLeaf },
  { label: "Profile", href: "/login", Icon: IconUser },
];

export default function MobileTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Quick navigation"
    >
      {TABS.map(({ label, href, Icon }) => (
        <Link
          key={href}
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
