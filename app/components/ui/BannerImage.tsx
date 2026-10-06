"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/** Banner background: a slow ambient zoom, plus a gentle parallax/zoom as the page scrolls. */
export default function BannerImage({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.min(window.scrollY, 400);
      el.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(${1 + y * 0.0002})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 will-change-transform">
      <Image src={src} alt="" fill priority className="animate-banner-zoom object-cover" />
    </div>
  );
}
