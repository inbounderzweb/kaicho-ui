"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Button from "../ui/Button";
import { NAV_LINKS, isNavLinkActive } from "./nav-links";
import { IconArrowRight, IconClose } from "../ui/icons";

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        tabIndex={-1}
        className={`absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          <Link href="/" onClick={onClose} aria-label="Kaicho Foods home" className="flex items-center">
            <Image
              src="/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg"
              alt="Kaicho Foods"
              width={116}
              height={37}
              className="h-8 w-auto"
            />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-brand-soft hover:text-brand"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Mobile navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              aria-current={isNavLinkActive(pathname, link.href) ? "page" : undefined}
              className={`px-3 py-3.5 text-[17px] transition-colors hover:text-brand ${isNavLinkActive(pathname, link.href) ? "font-bold text-brand-dark" : "font-normal text-ink"}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="border-t border-border px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <Button href="/products" onClick={onClose} className="w-full">
            Shop Now
            <IconArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
