export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "B2B", href: "/b2b" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/products" && pathname.startsWith("/category/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
