"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import Button from "../ui/Button";
import { NAV_LINKS } from "./nav-links";
import { IconClose, IconMail, IconPhone } from "../ui/icons";

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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
          <Image
            src="/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg"
            alt="Kaicho Foods"
            width={116}
            height={37}
            className="h-8 w-auto"
          />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-brand-soft hover:text-brand"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="rounded-xl px-3 py-3.5 text-lg font-semibold text-ink transition-colors hover:bg-brand-soft hover:text-brand"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="space-y-3 border-t border-border px-5 py-6">
          <a href="tel:+918792799631" className="flex items-center gap-3 text-sm text-ink-muted">
            <IconPhone className="h-4 w-4 text-brand" /> +91 87927 99631
          </a>
          <a href="mailto:hello@kaicho.in" className="flex items-center gap-3 text-sm text-ink-muted">
            <IconMail className="h-4 w-4 text-brand" /> hello@kaicho.in
          </a>
          <Button href="#products" onClick={onClose} className="mt-2 w-full">
            Shop Now
          </Button>
        </div>
      </div>
    </div>
  );
}
