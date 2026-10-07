"use client";

import { useEffect, useRef } from "react";
import Container from "../ui/Container";
import { IconBowl, IconChevronRight, IconFlame, IconPackage } from "../ui/icons";

const STEPS = [
  { step: "01", title: "Open the pack", Icon: IconPackage },
  { step: "02", title: "Heat the product", Icon: IconFlame },
  { step: "03", title: "Enjoy your meal", Icon: IconBowl },
];

// Each step holds for HOLD_MS, then the strip slides quickly (SLIDE_MS) to the
// next one. Any manual interaction pauses the auto-advance for another HOLD_MS.
const HOLD_MS = 3000;
const SLIDE_MS = 400;

export default function HowItWorks() {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastTouch = useRef(0);
  const hovering = useRef(false);
  const frame = useRef(0);
  const settle = useRef(0);

  // Fast eased slide. scroll-snap is switched off while it runs, otherwise the
  // browser fights every frame and the motion stutters.
  function slideTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    cancelAnimationFrame(frame.current);
    const from = track.scrollLeft;
    const to = index * track.clientWidth;
    const start = performance.now();
    track.style.scrollSnapType = "none";
    const step = (now: number) => {
      const t = Math.min((now - start) / SLIDE_MS, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      track.scrollLeft = from + (to - from) * eased;
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        track.style.scrollSnapType = "";
      }
    };
    frame.current = requestAnimationFrame(step);
  }

  function stopSlide() {
    cancelAnimationFrame(frame.current);
    if (trackRef.current) trackRef.current.style.scrollSnapType = "";
  }

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || hovering.current || document.hidden) return;
      if (Date.now() - lastTouch.current < HOLD_MS) return;
      slideTo(Math.round(track.scrollLeft / track.clientWidth) + 1);
    }, HOLD_MS);
    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(frame.current);
      window.clearTimeout(settle.current);
    };
  }, []);

  const markTouched = () => { lastTouch.current = Date.now(); };
  function move(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    markTouched();
    let index = Math.round(track.scrollLeft / track.clientWidth);
    // Going back from step 1: hop to the identical trailing copy, then slide back from there.
    if (direction === -1 && index <= 0) {
      stopSlide();
      track.style.scrollSnapType = "none";
      track.scrollLeft = STEPS.length * track.clientWidth;
      index = STEPS.length;
    }
    slideTo(index + direction);
  }
  const interrupt = () => { markTouched(); stopSlide(); };

  return (
    <section className="py-16 sm:py-20 bg-fixed">
      <Container fluid>
        {/* bg-fixed reuses the same pinned-background technique as Hero/StoryCover */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-forest sm:flex-row md:bg-[url('/desktop-coverimage.png')]">
          {/* ink, not forest — forest is literally the same color as the
              brand-green panel to its left, so a forest-tinted overlay left
              the step area indistinguishable from that panel */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/75" />

          <div className="relative z-10 flex shrink-0 flex-col justify-center bg-brand px-8 py-6 sm:w-64 sm:px-10 sm:py-8">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/85">
              How It Works
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
              Simple as Heat &amp; Eat
            </h2>
          </div>

          <div
            className="relative z-10 flex min-w-0 flex-1 flex-col justify-center py-7 sm:py-0"
            onMouseEnter={() => { hovering.current = true; }}
            onMouseLeave={() => { hovering.current = false; markTouched(); }}
          >
            {/* One step per view; native scroll + snap gives swipe / trackpad / drag-scroll */}
            <div
              ref={trackRef}
              className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
              role="group"
              aria-roledescription="carousel"
              aria-label="How it works steps"
              onScroll={(event) => {
                const track = event.currentTarget;
                const index = Math.round(track.scrollLeft / track.clientWidth);
                // Resting on the trailing copy of step 1 → silently rewind to the real one.
                window.clearTimeout(settle.current);
                if (index === STEPS.length) {
                  settle.current = window.setTimeout(() => {
                    if (Math.abs(track.scrollLeft - STEPS.length * track.clientWidth) < 2) {
                      track.style.scrollSnapType = "none";
                      track.scrollLeft = 0;
                      track.style.scrollSnapType = "";
                    }
                  }, 120);
                }
              }}
              onPointerDown={interrupt}
              onWheel={interrupt}
              onTouchStart={interrupt}
              onKeyDown={markTouched}
              tabIndex={0}
            >
              {[...STEPS, STEPS[0]].map(({ step, title, Icon }, position) => (
                <div
                  key={position}
                  aria-hidden={position === STEPS.length || undefined}
                  className="flex w-full shrink-0 snap-center items-center justify-center px-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <span className="absolute -top-3.5 left-0 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider text-white/50">
                        Step
                      </span>
                      <span className="block font-display text-4xl font-bold leading-none text-white/20 sm:text-5xl">
                        {step}
                      </span>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-soft">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="whitespace-nowrap font-display text-base font-semibold text-white sm:text-lg">
                      {title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {([-1, 1] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                aria-label={direction === -1 ? "Previous step" : "Next step"}
                onClick={() => move(direction)}
                className={`absolute top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 ${direction === -1 ? "left-3" : "right-3"}`}
              >
                <IconChevronRight className={`h-4 w-4 ${direction === -1 ? "rotate-180" : ""}`} />
              </button>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
