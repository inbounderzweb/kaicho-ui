"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import { IconArrowRight, IconHeart, IconLeaf, IconShieldCheck, IconWheat } from "../ui/icons";

const SLIDES = [
  {
    name: "Veg Oats",
    description:
      "Wholesome oats with real vegetables, sealed fresh with Japanese ",
    accent: "A nourishing meal, ready in minutes.",
    image: "/Broccoli-&-Mushroom-Oats-Porridge.png",
    alt: "Kaicho Veg Oats Porridge pouch beside a served bowl of porridge garnished with coriander, next to a wooden spoon",
    // Per-slide scale so both product shots read at the same visual size in
    // the shared frame — the two source PNGs are framed differently
    // (kaicho-hero.png is 3:2 with the pouch+bowl spread wide;
    // kaicho-chickenoats.png is 1:1 with the product filling the square).
    // The real fix is re-exporting both on one common canvas; this keeps
    // them consistent until then.
    imgScale: 1,
  },
  {
    name: "Veg Oats",
    description:
      "Wholesome oats with real vegetables, sealed fresh with Japanese ",
    accent: "A nourishing meal, ready in minutes.",
    image: "/image_navadhanya.png",
    alt: "Kaicho Veg Oats Porridge pouch beside a served bowl of porridge garnished with coriander, next to a wooden spoon",
    // Per-slide scale so both product shots read at the same visual size in
    // the shared frame — the two source PNGs are framed differently
    // (kaicho-hero.png is 3:2 with the pouch+bowl spread wide;
    // kaicho-chickenoats.png is 1:1 with the product filling the square).
    // The real fix is re-exporting both on one common canvas; this keeps
    // them consistent until then.
    imgScale: 1,
  }
];

const FEATURES = [
  { title: "100% Natural", Icon: IconLeaf },
  { title: "No Preservatives", Icon: IconShieldCheck },
  { title: "Diabetic Friendly", Icon: IconHeart },
  { title: "High in Fiber & Protein", Icon: IconWheat },
];

type LayoutProps = {
  slide: (typeof SLIDES)[number];
  active: number;
  setActive: (i: number) => void;
  markLoaded: (i: number) => void;
};

/* ── Shared product carousel ───────────────────────────────────────────────
   Same crossfade + rising steam in both layouts; only the outer frame size
   differs, passed in as `frameClassName`. Every slide's image is contained
   in the exact same 4:3 box, then nudged by its own imgScale so the products
   read at a consistent size as the carousel rotates. */
function ProductStage({
  active,
  markLoaded,
  frameClassName,
  scale = 1,
  steamX = 62,
  steamY = 55,
}: {
  active: number;
  markLoaded: (i: number) => void;
  frameClassName: string;
  /* multiplies each slide's imgScale — raise it to enlarge the product shot
     (both dimensions) without touching the frame's aspect ratio */
  scale?: number;
  /* bowl position as a % of the frame — where the steam rises from. The steam
     is scaled with the same `scale` as the art, so this stays glued to the
     bowl at any size; nudge if a new image frames the bowl differently. */
  steamX?: number;
  steamY?: number;
}) {
  return (
    <div className={`relative ${frameClassName}`}>
      {SLIDES.map((s, i) => (
        <div
          key={s.image}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: `scale(${s.imgScale * scale})` }}
        >
          <Image
            src={s.image}
            alt={s.alt}
            fill
            priority={i === 0}
            unoptimized={s.unoptimized}
            onLoad={() => markLoaded(i)}
            sizes="(min-width: 1280px) 820px, (min-width: 1024px) 720px, (min-width: 640px) 460px, 84vw"
            className="object-contain drop-shadow-[0_34px_54px_rgba(20,50,25,0.3)]"
          />
        </div>
      ))}

      {/* Rising steam over the served bowl — wrapped in the same `scale` as the
          product art so it tracks the bowl as the image grows/shrinks. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="absolute h-0 w-0" style={{ left: `${steamX}%`, top: `${steamY}%` }}>
          {[
            { left: -30, w: 16, h: 56, dur: 4.2, delay: 0 },
            { left: -14, w: 22, h: 72, dur: 5.0, delay: 0.5 },
            { left: 1, w: 30, h: 88, dur: 5.8, delay: 1.0 },
            { left: 17, w: 22, h: 70, dur: 4.7, delay: 1.6 },
            { left: 32, w: 16, h: 58, dur: 4.4, delay: 2.2 },
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
      </div>
    </div>
  );
}

/* ── Right-side feature rail (lg only) ────────────────────────────────────
   Vertical list of the same points, sitting to the right of the product
   shot: each point is an outlined circle badge holding its icon, joined by
   a dashed connector down the rail. Rendered only inside DesktopHero, so
   it is desktop-only. */
function FeatureRail({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-col gap-8 px-10 ${className}`}>
      {FEATURES.map(({ title, Icon }, i) => (
        <li key={title} className="relative flex items-center gap-4">
          {/* dashed connector down to the next badge */}
          {i < FEATURES.length - 1 && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-6 top-full h-8 -translate-x-1/2 border-l-2 border-dashed border-white/55"
            />
          )}
          {/* outlined circle badge */}
          <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/15 text-white backdrop-blur-sm">
            <Icon className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <span className="whitespace-nowrap text-[17px] font-bold leading-tight text-white">
            {title}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SlideDots({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {SLIDES.map((s, i) => (
        <button
          key={s.image}
          type="button"
          aria-label={`Show ${s.name} Porridge`}
          onClick={() => setActive(i)}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === active ? "w-6 bg-white" : "w-1.5 bg-brand/30 hover:bg-brand/50"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Shared 4-point strip ──────────────────────────────────────────────────
   Same box size, same cell sizing, same alignment on every screen — one row
   of four equal columns. `min-h` on the label keeps the box height and the
   icon row identical whether a label wraps to one line or two. */
function FeatureGrid({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid w-full max-w-md grid-cols-4 rounded-2xl border border-brand/50 p-1 backdrop-blur-sm ${className}`}
    >
      {FEATURES.map(({ title, Icon }, i) => (
        <div
          key={title}
          className={`flex flex-col items-center gap-1.5 px-1.5 text-center ${
            i > 0 ? "border-l border-brand/50" : ""
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-white">
            <Icon className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <p className="flex min-h-[3.2em] items-start justify-center text-balance text-[10px] md:text-[12px] font-bold leading-tight text-white">
            {title}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ══ SMALL SCREENS (< lg) ═════════════════════════════════════════════════
   One viewport, no scroll: image + headline + description + 4 points + CTA,
   tuned tight and vertically centred. Visual highlights are the product
   image, the headline, and the CTA. */
function MobileHero({ slide, active, setActive, markLoaded }: LayoutProps) {
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-5 py-4 text-center lg:hidden">
     {/* eyebrow */}
      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#f5f5f5]">
        <IconLeaf className="h-3.5 w-3.5 shrink-0" />
        Ready-to-Eat · Japanese Retort Tech
      </span>

      {/* headline */}
      <h1 className="font-display font-bold leading-[1.02] tracking-tight text-[#f5f5f5]">
        <span key={active} className="animate-fade-up block">
          <span className="block text-[clamp(1.6rem,6.5vw,2.4rem)]">{slide.name}</span>
          <span className="relative mt-0.5 inline-block text-[clamp(1.9rem,7.5vw,2.9rem)]">
            Porridge
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 h-[3px] w-2/3 rounded-full bg-brand/60"
            />
          </span>
        </span>
      </h1>

      {/* description */}
      <p
        key={`d-${active}`}
        className="animate-fade-up max-w-md text-[12.5px] leading-snug text-[#f5f5f5]"
      >
        {slide.description}
        <span className="mt-0.5 block font-semibold text-[#f5f5f5]">{slide.accent}</span>
      </p>
    
      <ProductStage
        active={active}
        markLoaded={markLoaded}
        frameClassName="aspect-4/3 h-[32vh] max-h-64 w-auto"
      />
      {/* 4 points */}
      <FeatureGrid />


      {/* CTA + slide dots */}
      <div className="flex flex-col items-center gap-2.5">
        <Button
          href="/products"
          size="lg"
          className="group h-11 gap-2 rounded-full px-7 shadow-[0_16px_34px_-14px_rgba(236,106,30,0.7)]"
        >
          Explore Our Meals
          <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
        <SlideDots active={active} setActive={setActive} />
      </div>
    </div>
  );
}

/* ══ LARGE SCREENS (>= lg) ════════════════════════════════════════════════
   Two-column layout: full-scale copy on the left, large product shot right. */
function DesktopHero({ slide, active, setActive, markLoaded }: LayoutProps) {
  return (
    <div className="relative z-10 mx-auto hidden w-full max-w-7xl flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center lg:gap-10 lg:px-8 lg:py-2">
      {/* LEFT — copy */}
      <div className="w-full max-w-xl text-left">
        {/* eyebrow */}
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#f5f5f5]">
          <IconLeaf className="h-3.5 w-3.5 shrink-0" />
          Ready-to-Eat · Japanese Retort Tech
        </span>

        {/* headline + highlighted product name */}
        <h1 className="mt-3 font-display font-bold leading-[1.02] tracking-tight text-[#f5f5f5]">
          <span key={active} className="animate-fade-up block">
            <span className="block text-[clamp(2.75rem,3.4vw+1rem,4.5rem)]">{slide.name}</span>
            <span className="relative mt-0.5 inline-block text-[clamp(3rem,3.8vw+1rem,5rem)]">
              Porridge
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-[3px] w-2/3 rounded-full bg-brand/60"
              />
            </span>
          </span>
        </h1>

        {/* description */}
        <p
          key={`d-${active}`}
          className="animate-fade-up mt-5 max-w-md text-base leading-relaxed text-[#f5f5f5]"
        >
          {slide.description}
          <span className="mt-1 block font-semibold text-[#f5f5f5]">{slide.accent}</span>
        </p>

        {/* feature box — 4 items (shared: identical size + alignment on every screen) */}
        {/* <FeatureGrid className="mt-6" /> */}

        {/* CTA + slide dots */}
        <div className="mt-7 flex flex-col items-start gap-4">
          <Button
            href="/products"
            size="lg"
            className="group h-13 gap-2 rounded-full px-8 shadow-[0_16px_34px_-14px_rgba(236,106,30,0.7)]"
          >
            Explore Our Meals
            <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          <SlideDots active={active} setActive={setActive} />
        </div>
      </div>

      {/* RIGHT — large product image + dotted feature rail */}
      <div className="flex w-full items-center justify-center gap-5 h-full">
        {/* 4:3 frame; scale enlarges the product shot itself (width + height) on desktop */}
        <ProductStage
          active={active}
          markLoaded={markLoaded}
          frameClassName="aspect-4/3 w-full min-w-0 flex-1"
          scale={1.7}
        />
        <FeatureRail className="shrink-0" />
      </div>
    </div>
  );
}

export default function Hero() {
  const [active, setActive] = useState(0);
  // How long each slide's image actually took to load, in ms — null until
  // its onLoad has fired.
  const [loadMs, setLoadMs] = useState<(number | null)[]>(() => SLIDES.map(() => null));
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  const markLoaded = (i: number) =>
    setLoadMs((prev) =>
      prev[i] !== null ? prev : prev.map((v, idx) => (idx === i ? performance.now() - mountedAt.current : v))
    );

  useEffect(() => {
    // Hold each slide for a 5s base plus its own measured image-load time
    // (capped at 4s), so a slower-loading photo genuinely gets more screen time.
    const ms = loadMs[active];
    if (ms === null) return;
    const hold = 5000 + Math.min(4000, Math.max(0, ms));
    const id = setTimeout(() => setActive((a) => (a + 1) % SLIDES.length), hold);
    return () => clearTimeout(id);
  }, [active, loadMs]);

  const slide = SLIDES[active];

  return (
    <section id="home" className="hero-viewport relative flex flex-col overflow-hidden bg-brand-soft">
      {/* nature background — blurred foliage + warm light */}
      <Image
        src="/desktop-coverimage.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* light wash: keeps the left-column dark text readable while letting the
          foliage show through on the right */}
      <div aria-hidden className="pointer-events-none absolute inset-0 sm:bg-gradient-to-r" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-white/25"
      />

      {/* Two independent layouts, swapped at `lg` via hidden/visible so each
          can be tuned without responsive-override churn. Carousel state lives
          here and feeds both. */}
      <MobileHero slide={slide} active={active} setActive={setActive} markLoaded={markLoaded} />
      <DesktopHero slide={slide} active={active} setActive={setActive} markLoaded={markLoaded} />
    </section>
  );
}
