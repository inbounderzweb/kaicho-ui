import type { ReactElement } from "react";
import {
  IconLayoutDashboard,
  IconUsers,
  IconPackage,
  IconTruck,
  IconImages,
  IconTag,
  IconStar,
  type IconProps,
} from "../ui/icons";

export interface AdminNavLink {
  href: string;
  label: string;
  Icon: (props: IconProps) => ReactElement;
  exact?: boolean;
}

export interface AdminNavGroup {
  label: string;
  Icon: (props: IconProps) => ReactElement;
  children: AdminNavLink[];
}

export type AdminNavItem = AdminNavLink | AdminNavGroup;

export function isAdminNavGroup(item: AdminNavItem): item is AdminNavGroup {
  return "children" in item;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: IconLayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", Icon: IconUsers },
  {
    label: "Catalog",
    Icon: IconTag,
    children: [
      { href: "/admin/categories", label: "Categories", Icon: IconTag },
      { href: "/admin/collections", label: "Collections", Icon: IconPackage },
      { href: "/admin/brands", label: "Brands", Icon: IconStar },
      { href: "/admin/products", label: "Products", Icon: IconPackage },
    ],
  },
  { href: "/admin/orders", label: "Orders", Icon: IconTruck },
  { href: "/admin/media", label: "Media", Icon: IconImages },
];
