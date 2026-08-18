import Image from "next/image";
import Link from "next/link";
import { IconChevronRight } from "./icons";

export type Breadcrumb = {
  label: string;
  href?: string;
};

export default function PageBanner({
  title,
  description,
  breadcrumbs,
  image = "/kaicho-lifestyle-banner.jpg",
}: {
  title: string;
  description?: string;
  breadcrumbs: Breadcrumb[];
  image?: string;
}) {
  return (
    <div className="relative h-[240px] w-full overflow-hidden sm:h-[280px] lg:h-[320px]">
      <Image src={image} alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/40 to-charcoal/20" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-[1280px] items-center gap-1.5 px-5 pb-5 text-xs font-medium text-white/75 sm:px-6 sm:pb-6 sm:text-sm lg:px-8"
      >
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {i > 0 && <IconChevronRight className="h-3.5 w-3.5 text-white/50" />}
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-white">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold text-white">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
