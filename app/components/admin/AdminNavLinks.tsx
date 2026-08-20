"use client";

import Link from "next/link";
import { ADMIN_NAV_ITEMS, isAdminNavGroup, type AdminNavLink } from "./admin-nav-items";

function isLinkActive(pathname: string, link: AdminNavLink) {
  return link.exact ? pathname === link.href : pathname.startsWith(link.href);
}

function NavLink({
  link,
  active,
  onNavigate,
  indent = false,
}: {
  link: AdminNavLink;
  active: boolean;
  onNavigate?: () => void;
  indent?: boolean;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
        indent ? "pl-9 pr-3" : "px-3"
      } ${
        active
          ? "bg-admin-primary/40 text-black dark:bg-admin-primary/25 dark:text-white"
          : "text-black/65 hover:bg-admin-primary/20 hover:text-black dark:text-white/65 dark:hover:bg-admin-primary/10 dark:hover:text-white"
      }`}
    >
      <link.Icon className="h-[18px] w-[18px] shrink-0" />
      {link.label}
    </Link>
  );
}

export default function AdminNavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {ADMIN_NAV_ITEMS.map((item) => {
        if (isAdminNavGroup(item)) {
          const groupActive = item.children.some((child) => isLinkActive(pathname, child));
          return (
            <div key={item.label} className="pt-1">
              <div
                className={`flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                  groupActive ? "text-black dark:text-white" : "text-black/45 dark:text-white/45"
                }`}
              >
                <item.Icon className="h-[15px] w-[15px] shrink-0" />
                {item.label}
              </div>
              <div className="flex flex-col gap-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.href}
                    link={child}
                    active={isLinkActive(pathname, child)}
                    onNavigate={onNavigate}
                    indent
                  />
                ))}
              </div>
            </div>
          );
        }
        return (
          <NavLink key={item.href} link={item} active={isLinkActive(pathname, item)} onNavigate={onNavigate} />
        );
      })}
    </nav>
  );
}
