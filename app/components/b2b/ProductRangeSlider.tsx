"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiPause, FiPlay } from "react-icons/fi";

type Product = { name: string; image: string };

export default function ProductRangeSlider({ products }: { products: Product[] }) {
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  const count = products.length;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    preference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      preference.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const advance = useCallback((step: number) => {
    if (direction || count < 2) return;
    if (reducedMotion) {
      setOffset(value => (value - step + count) % count);
    } else {
      setDirection(step);
    }
  }, [count, direction, reducedMotion]);

  useEffect(() => {
    if (!direction) return;
    const timer = window.setTimeout(() => {
      setOffset(value => (value - direction + count) % count);
      setDirection(0);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [count, direction]);

  useEffect(() => {
    if (paused || interacting || focused || reducedMotion || !visible || direction || count < 2) return;
    const timer = window.setTimeout(() => advance(1), 4000);
    return () => window.clearTimeout(timer);
  }, [advance, paused, interacting, focused, reducedMotion, visible, direction, count]);

  const togglePlayback = () => {
    if (paused) {
      // Explicit Play overrides the hover/focus that activated this button.
      // A new hover or focus interaction can still pause autoplay afterward.
      setInteracting(false);
      setFocused(false);
      setPaused(false);
      advance(1);
    } else {
      setPaused(true);
    }
  };

  if (!count) return null;

  const controlClass = "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-brand-dark transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Our product range"
      className="min-w-0"

    >
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-live="off"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      >
        {products.slice(0, 4).map((_, slot) => {
          const current = products[(offset + slot) % count];
          return (
            <div key={slot} className={`min-w-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm ${slot > 1 ? "hidden sm:block" : ""}`}>
              <Link href="/products" aria-label={`Explore ${current.name}`} className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand">
                <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: `translateX(${direction * 100}%)`,
                      transition: direction ? "transform 1500ms cubic-bezier(0.45, 0, 0.2, 1)" : "none",
                    }}
                  >
                    {[-1, 0, 1].map(position => {
                      const product = products[(offset + slot + position + count) % count];
                      return (
                        <div key={position} aria-hidden={position !== 0} className="absolute inset-0" style={{ transform: `translateX(${position * 100}%)` }}>
                          <Image src={product.image} alt={position === 0 ? product.name : ""} fill sizes="(min-width: 1024px) 190px, (min-width: 640px) 23vw, 45vw" className="object-contain p-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <h3 className="flex min-h-20 items-center justify-center px-3 py-3 text-center text-xs font-semibold leading-5 sm:text-sm">{current.name}</h3>
              </Link>
            </div>
          );
        })}
      </div>
      {count > 1 && (
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" aria-label="Previous products" disabled={!!direction} onClick={() => advance(-1)} className={controlClass}><FiArrowLeft aria-hidden="true" /></button>
          {!reducedMotion && <button type="button" aria-label={paused ? "Play product slideshow" : "Pause product slideshow"} onClick={togglePlayback} className={controlClass}>{paused ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}</button>}
          <button type="button" aria-label="Next products" disabled={!!direction} onClick={() => advance(1)} className={controlClass}><FiArrowRight aria-hidden="true" /></button>
        </div>
      )}
    </div>
  );
}
