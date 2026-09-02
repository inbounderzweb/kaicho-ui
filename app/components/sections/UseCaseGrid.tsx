"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";

const BIG_IMAGE = "https://cdn.shopify.com/s/files/1/0768/7979/0338/files/bigslide.jpg?v=1779453605";

const MOMENTS = [
  { title: "Road Trips", copy: "Easy to carry, perfect on the go." },
  { title: "Running Late for Office?", copy: "Just heat and eat before you leave." },
  { title: "Late Night Hunger?", copy: "Warm, filling meals anytime." },
  { title: "During Fever or Recovery", copy: "Light, comforting, and easy to eat." },
  { title: "Hostel & PG Life", copy: "Simple meals without cooking hassle." },
  { title: "Travel & Staycations", copy: "Easy to store and carry anywhere." },
  { title: "Busy Family Days", copy: "Simple meals for packed routines." },
  { title: "Work From Home", copy: "Quick meals between meetings." },
].map((m, i) => ({
  ...m,
  number: String(i + 1).padStart(2, "0"),
  src: `https://cdn.shopify.com/s/files/1/0768/7979/0338/files/card${i + 1}_1.png?v=1779454715`,
}));

function MomentCard({
  moment,
  imgSizes,
  className = "",
  showNumber = true,
}: {
  moment: (typeof MOMENTS)[number];
  imgSizes: string;
  className?: string;
  showNumber?: boolean;
}) {
  return (
    <div className={className}>
      <div className="relative">
        {showNumber && (
          <span className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-sm">
            {moment.number}
          </span>
        )}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
          <Image
            src={moment.src}
            alt={moment.title}
            fill
            sizes={imgSizes}
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      </div>
      <p className="mt-3 text-center font-display text-sm font-bold leading-snug text-brand-dark sm:text-base">
        {moment.title}
      </p>
      <p className="mt-1 text-center text-xs leading-snug text-ink-muted sm:text-sm">
        {moment.copy}
      </p>
    </div>
  );
}

function BigImageCaption({ mobileHidden = false }: { mobileHidden?: boolean }) {
  return (
    <div
      className={`absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 ${
        mobileHidden ? "hidden sm:block" : ""
      }`}
    >
      <p className="font-display text-lg font-bold leading-snug sm:text-xl">
        <span className="bg-white/90 px-1.5 text-ink">Whenever life gets busy,</span>
        <br />
        <span className="bg-white/90 px-1.5 text-ink">Kaicho is always ready.</span>
      </p>
    </div>
  );
}

export default function UseCaseGrid() {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % MOMENTS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Scroll only the horizontal track itself (never scrollIntoView) — that
    // API can also nudge the page's vertical scroll position even with
    // block: "nearest", which was yanking the whole section into view every
    // time the slide auto-advanced.
    const track = trackRef.current;
    const item = track?.children[active] as HTMLElement | undefined;
    if (track && item) {
      track.scrollTo({ left: item.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }
  }, [active]);

  return (
    <section className="bg-cream py-20 sm:py-24 md:py-12">
      <Container>
        <SectionHeading
          eyebrow="Everyday Moments"
          heading="Where Kaicho Fits Into Your Day"
          subheading="Good food, ready when you need it."
        />

        {/* Mobile + tablet: big image on top, then either a slider (mobile) or a 2-col grid (tablet) */}
        <div className="mt-10 lg:hidden">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl shadow-[0_20px_45px_-20px_rgba(28,28,28,0.3)] sm:aspect-[16/9] sm:max-w-2xl">
            <Image
              src={BIG_IMAGE}
              alt="A day with Kaicho"
              fill
              sizes="(min-width: 640px) 672px, 100vw"
              className="object-cover"
            />
            <BigImageCaption mobileHidden />
          </div>

          {/* counter, mobile only */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-ink-muted sm:hidden">
            <span className="text-ink">{String(active + 1).padStart(2, "0")}</span>
            <span className="h-px w-6 bg-border" />
            <span>{String(MOMENTS.length).padStart(2, "0")}</span>
          </div>

          {/* tablet: 2-col grid */}
          <div className="mt-5 hidden grid-cols-2 gap-x-4 gap-y-8 sm:grid lg:hidden">
            {MOMENTS.map((moment) => (
              <MomentCard key={moment.src} moment={moment} imgSizes="45vw" />
            ))}
          </div>

          {/* mobile: auto-scrolling slider */}
          <div
            ref={trackRef}
            className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 pb-1 sm:hidden"
          >
            {MOMENTS.map((moment) => (
              <MomentCard
                key={moment.src}
                moment={moment}
                imgSizes="42vw"
                className="w-[42vw] shrink-0 snap-start"
                showNumber={false}
              />
            ))}
          </div>

          {/* dots, mobile only */}
          <div className="mt-4 flex items-center justify-center gap-1.5 sm:hidden">
            {MOMENTS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show moment ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-5 bg-brand" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: 4 images left, big image center, 4 images right */}
        <div className="mt-14 hidden grid-cols-[1fr_1.4fr_1fr] items-center gap-x-5 gap-y-10 lg:grid xl:gap-x-7">
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 xl:gap-x-7">
            {MOMENTS.slice(0, 4).map((moment) => (
              <MomentCard key={moment.src} moment={moment} imgSizes="180px" />
            ))}
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(28,28,28,0.35)]">
            <Image
              src={BIG_IMAGE}
              alt="A day with Kaicho"
              fill
              sizes="480px"
              className="object-cover"
            />
            <BigImageCaption />
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-10 xl:gap-x-7">
            {MOMENTS.slice(4, 8).map((moment) => (
              <MomentCard key={moment.src} moment={moment} imgSizes="180px" />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
