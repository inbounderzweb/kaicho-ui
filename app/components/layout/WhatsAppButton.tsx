"use client";

import { useEffect, useRef, useState } from "react";
import { IconWhatsapp, IconPhone, IconClose } from "../ui/icons";

// Floating contact button. Tapping it opens a small speed-dial with two
// actions — Call and WhatsApp. Kept as a client component for the open/close
// state; rendered once by StorefrontChrome (never on /admin/**).
const WHATSAPP_URL = "https://wa.me/918792799631";
const CALL_URL = "tel:+918792799631";

const PILL =
  "rounded-full bg-charcoal/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md";
const ACTION_CIRCLE =
  "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg shadow-black/20 transition-transform group-hover:scale-105 group-active:scale-95";

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
    >
      {/* Speed-dial actions */}
      <div
        className={`flex flex-col items-end gap-3 transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <a
          href={CALL_URL}
          aria-label="Call Kaicho Foods"
          className="group flex items-center gap-2.5"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        >
          <span className={PILL}>Call us</span>
          <span className={`${ACTION_CIRCLE} bg-[#2563eb]`}>
            <IconPhone className="h-5 w-5" />
          </span>
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className="group flex items-center gap-2.5"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        >
          <span className={PILL}>WhatsApp</span>
          <span className={`${ACTION_CIRCLE} bg-[#25D366]`}>
            <IconWhatsapp className="h-6 w-6" />
          </span>
        </a>
      </div>

      {/* FAB toggle — keeps its WhatsApp-green identity; shows an X when open */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? "Close contact options" : "Contact us on WhatsApp or by phone"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 active:scale-95"
      >
        <span className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          {open ? <IconClose className="h-6 w-6" /> : <IconWhatsapp className="h-7 w-7" />}
        </span>
      </button>
    </div>
  );
}
