"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "../Button";
import { IconArrowRight, IconBowl, IconChevronLeft, IconChevronRight, IconPackage, IconShieldCheck } from "../icons";
import HeroArt from "./HeroArt";

const SLIDES = [
  {
    kicker: "Ready-to-Eat",
    title: "Chicken Oats Porridge",
    copy: "High-protein comfort food, packed in minutes and ready whenever hunger strikes.",
    accent: "#C97B4A",
  },
  {
    kicker: "Ready-to-Eat",
    title: "Veg Oats Porridge",
    copy: "Wholesome oats and vegetables simmered into a light, gut-friendly bowl.",
    accent: "#00A861",
  },
  {
    kicker: "Ready-to-Eat",
    title: "Mixed Millet Porridge",
    copy: "Nine ancient grains, one nourishing bowl — a Karkidakam classic, reimagined.",
    accent: "#8A6D3B",
  },
];

const FEATURES = [
  { label: "No Preservatives", Icon: IconShieldCheck },
  { label: "Ready To Eat", Icon: IconBowl },
  { label: "Japanese Retort Tech", Icon: IconPackage },
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next]);

  const slide = SLIDES[index];

  return (
    <section id="home" className="relative overflow-hidden bg-cream">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-10 px-5 py-14 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-20">
        <div className="order-2 lg:order-1">
          <span
            key={`kicker-${index}`}
            className="animate-fade-up inline-block text-sm font-bold uppercase tracking-[0.2em] text-brand"
          >
            {slide.kicker}
          </span>
          <h1
            key={`title-${index}`}
            className="animate-fade-up mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]"
          >
            {slide.title}
          </h1>
          <p
            key={`copy-${index}`}
            className="animate-fade-up mt-5 max-w-md text-base leading-relaxed text-ink-muted"
          >
            {slide.copy}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button href="#products" size="lg">
              Explore Our Meals
              <IconArrowRight className="h-4 w-4" />
            </Button>
            <Button href="#story" variant="outline" size="lg">
              Our Story
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            {FEATURES.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand shadow-sm shadow-ink/5">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="relative mx-auto aspect-square w-full max-w-md rounded-[2.5rem] bg-white/60 p-6 shadow-[0_30px_60px_-30px_rgba(28,28,28,0.25)] ring-1 ring-ink/5 sm:p-8">
            <HeroArt accent={slide.accent} />
          </div>

          <button
            type="button"
            onClick={prev}
            aria-label="Previous meal"
            className="absolute left-0 top-1/2 hidden -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-2.5 text-ink shadow-md transition hover:text-brand sm:flex"
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next meal"
            className="absolute right-0 top-1/2 hidden translate-x-2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-2.5 text-ink shadow-md transition hover:text-brand sm:flex"
          >
            <IconChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-8 lg:pb-10">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            aria-label={`Show ${s.title}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-7 bg-brand" : "w-2 bg-ink/15"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
