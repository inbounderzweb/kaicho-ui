import Link from "next/link";
import JsonLd from "../seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { IconChevronRight } from "./icons";
import type { Breadcrumb } from "./PageBanner";

export type { Breadcrumb };

// Text-style breadcrumb nav for pages that don't use PageBanner's image
// hero (product listing, product detail, category landing) — same
// semantics (a <nav aria-label="Breadcrumb">, the current page rendered as
// plain text rather than a link, BreadcrumbList structured data) as
// PageBanner's built-in breadcrumb, just without the banner chrome. Reuses
// the same Breadcrumb type and breadcrumbJsonLd() helper so both never
// drift apart.
export default function Breadcrumbs({
  items,
  className = "",
}: {
  items: Breadcrumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink-muted sm:text-sm ${className}`}
    >
      <JsonLd data={breadcrumbJsonLd(items.map((crumb) => ({ name: crumb.label, path: crumb.href })))} />
      {items.map((crumb, i) => {
        const isCurrentPage = i === items.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <IconChevronRight className="h-3.5 w-3.5 text-ink-faint" />}
            {isCurrentPage ? (
              <span aria-current="page" className="font-semibold text-ink">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="transition-colors hover:text-brand">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
