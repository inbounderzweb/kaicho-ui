"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconCart, IconHeart, IconHome, IconUser } from "../ui/icons";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { getAccountHref } from "@/lib/auth/getAccountHref";

import { isNavLinkActive } from "./nav-links";
import styles from "./HomeChrome.module.css";

const BASE_TABS = [
  { label: "Home", href: "/", Icon: IconHome },
  { label: "Shop", href: "/products", Icon: IconCart },
  { label: "Wishlist", href: "/wishlist", Icon: IconHeart },
];

// Other storefront pages reveal the bar after scrolling; the homepage keeps
// its main shopping shortcuts available from the first screen.
const REVEAL_AFTER = 60;

export default function MobileTabBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { data: user } = useCurrentUser();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const onScroll = () => setRevealed(window.scrollY > REVEAL_AFTER);
    onScroll(); // account for a page that loads already scrolled
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accountTab = {
    label: "Account",
    href: getAccountHref(user),
    Icon: IconUser,
  };
  const tabs = [...BASE_TABS, accountTab];
  const visible = isHome || revealed;

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] transition-[transform,opacity] duration-700 ease-out lg:hidden ${isHome ? styles.homeTabBar : ""} ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
      aria-label="Quick navigation"
      aria-hidden={!visible}
    >
      {tabs.map(({ label, href, Icon }) => (
        <Link
          key={label}
          href={href}
          tabIndex={visible ? undefined : -1}
          aria-current={isNavLinkActive(pathname, href) ? "page" : undefined}
          className={`flex flex-1 flex-col items-center gap-1 border-t-2 py-2.5 transition-colors active:text-brand ${isNavLinkActive(pathname, href) ? "border-brand bg-brand-soft text-brand-dark" : "border-transparent text-ink-muted"}`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[11px] font-semibold">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
