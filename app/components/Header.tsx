"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "./Button";
import MobileMenu from "./MobileMenu";
import { NAV_LINKS } from "./nav-links";
import { IconCart, IconHeart, IconMenu, IconSearch, IconUser } from "./icons";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur transition-shadow ${
          scrolled ? "shadow-[0_1px_0_0_rgba(0,0,0,0.06)]" : ""
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="#home" className="flex shrink-0 items-center" aria-label="Kaicho Foods home">
            <Image
              src="/logo_07aad60c-0e17-4a1b-936b-88609e93a1cc.svg"
              alt="Kaicho Foods"
              width={132}
              height={42}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative py-2 text-[15px] font-semibold text-ink transition-colors hover:text-brand"
              >
                {link.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-brand transition-transform duration-200 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label="Search"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-brand-soft hover:text-brand sm:inline-flex"
            >
              <IconSearch className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Account"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-brand-soft hover:text-brand sm:inline-flex"
            >
              <IconUser className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Wishlist"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-brand-soft hover:text-brand sm:inline-flex"
            >
              <IconHeart className="h-5 w-5" />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                0
              </span>
            </button>
            <button
              type="button"
              aria-label="Cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-brand-soft hover:text-brand"
            >
              <IconCart className="h-5 w-5" />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                0
              </span>
            </button>

            <Button href="#products" variant="primary" size="sm" className="ml-2 hidden lg:inline-flex">
              Shop Now
            </Button>

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-brand-soft hover:text-brand lg:hidden"
            >
              <IconMenu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
