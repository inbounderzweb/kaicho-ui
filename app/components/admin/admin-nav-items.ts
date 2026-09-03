import type { ReactElement } from "react";
import {
  IconLayoutDashboard,
  IconUsers,
  IconPackage,
  IconTruck,
  IconImages,
  IconTag,
  IconStar,
  IconFileText,
  IconMessageCircle,
  IconMail,
  IconSettings,
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
  {
    label: "Inquiries",
    Icon: IconMessageCircle,
    children: [
      { href: "/admin/inquiries", label: "All Inquiries", Icon: IconMessageCircle },
      { href: "/admin/inquiries/bulk-order", label: "Bulk Order Inquiries", Icon: IconPackage, exact: true },
      { href: "/admin/inquiries/contact", label: "Contact Inquiries", Icon: IconMail, exact: true },
    ],
  },
  {
    label: "Content",
    Icon: IconFileText,
    children: [
      { href: "/admin/blogs", label: "All Blogs", Icon: IconFileText },
      { href: "/admin/blogs/new", label: "Add Blog", Icon: IconFileText, exact: true },
      { href: "/admin/blogs/categories", label: "Categories", Icon: IconTag },
    ],
  },
  { href: "/admin/media", label: "Media", Icon: IconImages },
  { href: "/admin/settings", label: "Settings", Icon: IconSettings },
];
