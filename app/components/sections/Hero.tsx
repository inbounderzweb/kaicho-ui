"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Button from "../Button";
import {
  IconArrowRight,
  IconChevronRight,
  IconHeart,
  IconLeaf,
  IconPackage,
  IconPulse,
  IconShieldCheck,
  IconWheat,
} from "../icons";

const SLIDES = [
  {
    headline: "Veg Oats Porridge",
    image: "/kaicho-hero.png",
    alt: "Kaicho Veg Oats Porridge pouch beside a served bowl of porridge garnished with coriander, next to a wooden spoon",
  },
  {
    headline: "Chicken Oats Porridge",
    image: "/kaicho-chickenoats.png",
    alt: "Kaicho Chicken Oats Porridge pouch beside a served bowl of porridge",
    // Next's image optimizer flattens this PNG's transparent background to
    // solid black (reproducible via /_next/image?url=...); serve as-is.
    unoptimized: true,
  },
];

const FEATURES_LEFT = [
  { title: "100% Natural", Icon: IconLeaf },
  { title: "No Preservatives", Icon: IconShieldCheck },
  { title: "Diabetic-Friendly", Icon: IconHeart },
];

const FEATURES_RIGHT = [
  { title: "High in Fiber & Protein", Icon: IconWheat },
  { title: "Gut-Healthy Ingredients", Icon: IconPulse },
  { title: "Japanese Retort Technology", Icon: IconPackage },
];

const FEATURE_TOPS = ["2%", "38%", "74%"];

export default function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" className="hero-viewport relative flex flex-col bg-white">
      <div className="flex w-full flex-1 flex-col p-3 sm:p-4 md:p-5 lg:p-6">
        {/* premium panel */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl bg-forest bg-[url('/mobile-coverimage.png')] bg-cover bg-center md:bg-[url('/desktop-coverimage.png')]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-forest/35 md:bg-forest/45"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(255,255,255,0.09),transparent_60%)]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-display text-[clamp(6rem,22vw,16rem)] font-bold text-white/[0.045]"
          >
            KAICHO
          </span>

          <div className="relative z-10 flex flex-1 flex-col px-(--hero-inset) py-[clamp(1rem,2.5svh,2.5rem)]">
            {/* eyebrow */}
            <span className="animate-fade-up mx-auto inline-flex items-center gap-1.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:text-xs">
  <IconLeaf className="h-3 w-3 shrink-0" />
  Ready-to-Eat · Japanese Retort Tech
</span>

            {/* headline */}
            <h1 className="mt-[clamp(0.25rem,1.2svh,1rem)] text-center font-display text-[clamp(2rem,9vw,2.75rem)] font-bold leading-[0.95] tracking-tight sm:text-[clamp(2.5rem,5vw_+_1rem,5.5rem)] lg:text-[clamp(2.5rem,2svh+1.6vw,4.75rem)]">
              <span key={active} className="animate-fade-up mt-5 block text-white">
                {SLIDES[active].headline}
              </span>
            </h1>

            {/* product photography */}
            <div className="relative flex flex-1 items-center justify-center py-[clamp(0.25rem,1.5svh,1.25rem)]">
              <div className="relative aspect-[3/2] w-[64%] max-w-215 max-h-[32svh] sm:max-h-[42svh] md:w-full lg:max-h-[36svh]">
                {SLIDES.map((slide, i) => (
                  <Image
                    key={slide.image}
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    priority={i === 0}
                    unoptimized={slide.unoptimized}
                    sizes="(min-width: 1024px) 720px, 90vw"
                    className={`absolute inset-0 object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.45)] transition-all duration-1200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      i === active ? "opacity-100 scale-100" : "opacity-0 scale-90"
                    }`}
                  />
                ))}

                {/* rising steam over the served bowl */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-[62%] top-[56%] h-0 w-0 sm:left-[64%]"
                >
                  {[
                    { left: -34, w: 14, h: 46, dur: 3.6, delay: 0 },
                    { left: -16, w: 20, h: 62, dur: 4.4, delay: 0.4 },
                    { left: 2, w: 26, h: 78, dur: 5, delay: 0.9 },
                    { left: 20, w: 22, h: 68, dur: 4.2, delay: 1.4 },
                    { left: 38, w: 16, h: 52, dur: 3.8, delay: 1.9 },
                    { left: -4, w: 12, h: 40, dur: 3.4, delay: 2.4 },
                  ].map((wisp, i) => (
                    <span
                      key={i}
                      className="animate-steam absolute bottom-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),rgba(255,255,255,0)_70%)] blur-[4px]"
                      style={{
                        left: `${wisp.left}px`,
                        width: `${wisp.w}px`,
                        height: `${wisp.h}px`,
                        animationDuration: `${wisp.dur}s`,
                        animationDelay: `${wisp.delay}s`,
                      }}
                    />
                  ))}
                </div>

                {/* dotted connector lines from badges to pin markers, tablet+ */}
                <svg
                  aria-hidden
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
                >
                  <line x1="1.5" y1="8.6" x2="36" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="1 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1="1.5" y1="44.6" x2="33" y2="46" stroke="white" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="1 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1="1.5" y1="80.6" x2="30" y2="79" stroke="white" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="1 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1="98.5" y1="8.6" x2="74" y2="30" stroke="white" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="1 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1="98.5" y1="44.6" x2="76" y2="55" stroke="white" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="1 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <line x1="98.5" y1="80.6" x2="73" y2="78" stroke="white" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="1 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>

                {/* squared-elbow connector lines from badges to pin markers, mobile only */}
                <svg
                  aria-hidden
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 block h-full w-full md:hidden"
                >
                  <polyline points="0,11.5 23,11.5 36,10" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="1 3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <polyline points="0,47.5 21,47.5 33,46" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="1 3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <polyline points="0,83.5 20,83.5 30,79" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="1 3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <polyline points="100,11.5 77,11.5 74,30" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="1 3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <polyline points="100,47.5 79,47.5 76,55" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="1 3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <polyline points="100,83.5 78,83.5 73,78" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="1 3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </svg>

                {/* pin markers on the photo */}
                <span className="absolute left-[36%] top-[10%] block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.25)] md:h-2.5 md:w-2.5 md:shadow-[0_0_0_3px_rgba(255,255,255,0.25)]" />
                <span className="absolute left-[33%] top-[46%] block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.25)] md:h-2.5 md:w-2.5 md:shadow-[0_0_0_3px_rgba(255,255,255,0.25)]" />
                <span className="absolute left-[30%] top-[79%] block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.25)] md:h-2.5 md:w-2.5 md:shadow-[0_0_0_3px_rgba(255,255,255,0.25)]" />
                <span className="absolute left-[74%] top-[30%] block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.25)] md:h-2.5 md:w-2.5 md:shadow-[0_0_0_3px_rgba(255,255,255,0.25)]" />
                <span className="absolute left-[76%] top-[55%] block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.25)] md:h-2.5 md:w-2.5 md:shadow-[0_0_0_3px_rgba(255,255,255,0.25)]" />
                <span className="absolute left-[73%] top-[78%] block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_1.5px_rgba(255,255,255,0.25)] md:h-2.5 md:w-2.5 md:shadow-[0_0_0_3px_rgba(255,255,255,0.25)]" />

                {/* feature badges: left column — icon square + title */}
                {FEATURES_LEFT.map(({ title, Icon }, i) => (
                  <div
                    key={title}
                    className="absolute left-0 hidden w-37.5 translate-x-[-14%] flex-col items-start gap-1 md:flex"
                    style={{ top: FEATURE_TOPS[i] }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-forest-light/80 backdrop-blur-sm">
                      <Icon className="h-3.5 w-3.5 text-cream-deep" strokeWidth={1.6} />
                    </span>
                    <p className="line-clamp-2 text-[9px] font-bold leading-tight text-white">{title}</p>
                  </div>
                ))}

                {/* feature badges: right column — icon square + title */}
                {FEATURES_RIGHT.map(({ title, Icon }, i) => (
                  <div
                    key={title}
                    className="absolute right-0 hidden w-37.5 translate-x-[14%] flex-col items-end gap-1 md:flex"
                    style={{ top: FEATURE_TOPS[i] }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-forest-light/80 backdrop-blur-sm">
                      <Icon className="h-3.5 w-3.5 text-cream-deep" strokeWidth={1.6} />
                    </span>
                    <p className="line-clamp-2 text-right text-[11px] font-bold leading-tight text-white">{title}</p>
                  </div>
                ))}

                {/* feature badges: left column, mobile only — icon + title, pinned beside the photo */}
                {FEATURES_LEFT.map(({ title, Icon }, i) => (
                  <div
                    key={title}
                    className="absolute right-full mr-1 flex w-13 flex-col items-end gap-0.5 md:hidden"
                    style={{ top: FEATURE_TOPS[i] }}
                  >
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-md border border-white/10 bg-forest-light/80 backdrop-blur-sm">
                      <Icon className="h-2.5 w-2.5 text-cream-deep" strokeWidth={1.8} />
                    </span>
                    <p className="text-[7px] font-bold leading-tight text-white">{title}</p>
                  </div>
                ))}

                {/* feature badges: right column, mobile only — icon + title, pinned beside the photo */}
                {FEATURES_RIGHT.map(({ title, Icon }, i) => (
                  <div
                    key={title}
                    className="absolute left-full ml-1 flex w-13 flex-col items-start gap-0.5 md:hidden"
                    style={{ top: FEATURE_TOPS[i] }}
                  >
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-md border border-white/10 bg-forest-light/80 backdrop-blur-sm">
                      <Icon className="h-2.5 w-2.5 text-cream-deep" strokeWidth={1.8} />
                    </span>
                    <p className="text-[7px] font-bold leading-tight text-white">{title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* slide indicators */}
            <div className="mx-auto flex items-center justify-center gap-1.5">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.image}
                  type="button"
                  aria-label={`Show ${slide.headline}`}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            {/* description + CTA */}
            <p className="animate-fade-up mx-auto mt-[clamp(0.5rem,1.5svh,1.75rem)] max-w-md text-center text-[clamp(0.78rem,3vw,0.88rem)] leading-relaxed text-cream-deep/85 sm:text-[clamp(0.85rem,0.3vw_+_0.78rem,1rem)]">
              Wholesome oats with real vegetables, sealed fresh with Japanese retort technology. A nourishing meal, ready in minutes.
            </p>

            <div className="animate-fade-up mx-auto mt-[clamp(0.75rem,1.5svh,1.75rem)]">
              <Button
                href="#products"
                size="lg"
                className="group h-10! gap-1.5! px-6! text-sm! bg-white! text-forest! hover:bg-cream-deep! sm:h-12! sm:gap-2! sm:px-8! sm:text-base!"
              >
                Explore Our Meals
                <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* scroll hint — bounces gently to signal there's more content below */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
              aria-label="Scroll to next section"
              className="animate-bounce mx-auto mt-1 text-white/70 transition-colors hover:text-white"
            >
              <IconChevronRight className="h-4 w-4 rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
