import Image from "next/image";
import Link from "next/link";
import Button from "../Button";
import {
  IconArrowRight,
  IconInstagram,
  IconLeaf,
  IconPhone,
  IconSprout,
} from "../icons";

const BADGES = [
  { value: "100%", label: "Organic", Icon: IconLeaf },
  { value: "Farm to", label: "Table", Icon: IconSprout },
];

export default function Hero() {
  return (
    <section id="home" className="hero-viewport relative bg-white">
      <div className="flex h-full w-full flex-col p-3 sm:p-4 md:p-5 lg:p-6">
        {/* premium panel */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-t-[1.75rem] bg-forest sm:rounded-t-[2.25rem] md:rounded-t-[3rem]">
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
            <span className="animate-fade-up mx-auto inline-flex items-center gap-2 text-center text-[clamp(0.62rem,0.3vw_+_0.56rem,0.8rem)] font-bold uppercase tracking-[0.3em] text-gold">
              <IconLeaf className="h-3.5 w-3.5 shrink-0" />
              Ready-to-Eat &middot; Japanese Retort Tech
            </span>

            {/* headline */}
            <h1 className="animate-fade-up mt-[clamp(0.25rem,1.2svh,1rem)] text-center font-display text-[clamp(2.5rem,5vw_+_1rem,5.5rem)] font-bold leading-[0.95] tracking-tight lg:text-[clamp(2.5rem,2svh+1.6vw,4.75rem)]">
              <span className="block text-white">Veg Oats</span>
              <span className="block text-gold">Porridge</span>
            </h1>

            {/* product photography */}
            <div className="relative flex flex-1 items-center justify-center py-[clamp(0.25rem,1.5svh,1.25rem)]">
              <div className="relative aspect-[3/2] w-full max-w-[720px] max-h-[32svh] sm:max-h-[38svh] lg:max-h-[27svh]">
                <Image
                  src="/kaicho-hero.png"
                  alt="Kaicho Veg Oats Porridge pouch beside a served bowl of porridge garnished with coriander, next to a wooden spoon"
                  fill
                  priority
                  sizes="(min-width: 1024px) 720px, 90vw"
                  className="animate-fade-scale object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.45)]"
                />

                {/* pin markers on the photo, tablet+ */}
                <span className="absolute left-[31%] top-[40%] hidden h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 bg-white/30 md:block" />
                <span className="absolute left-[78%] top-[58%] hidden h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 bg-white/30 md:block" />

                {/* badge: left — icon square + stat + progress underline */}
                <div className="absolute left-0 top-[16%] hidden w-[150px] -translate-x-[14%] items-start gap-3 md:flex">
                  <span className="mt-6 h-px w-8 shrink-0 bg-white/30" />
                  <div className="flex flex-col gap-2.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-forest-light/80 backdrop-blur-sm">
                      <IconLeaf className="h-5 w-5 text-cream-deep" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="text-lg font-bold leading-none text-white">{BADGES[0].value}</p>
                      <p className="mt-1 text-xs font-medium text-cream-deep/80">{BADGES[0].label}</p>
                    </div>
                    <span className="flex items-center gap-1">
                      <span className="h-1 w-8 rounded-full bg-white" />
                      <span className="h-px flex-1 bg-white/25" />
                    </span>
                  </div>
                </div>

                {/* badge: right — icon square + stat + progress underline */}
                <div className="absolute right-0 top-[46%] hidden w-[150px] translate-x-[14%] flex-row-reverse items-start gap-3 md:flex">
                  <span className="mt-6 h-px w-8 shrink-0 bg-white/30" />
                  <div className="flex flex-col items-end gap-2.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-forest-light/80 backdrop-blur-sm">
                      <IconSprout className="h-5 w-5 text-cream-deep" strokeWidth={1.5} />
                    </span>
                    <div className="text-right">
                      <p className="text-lg font-bold leading-none text-white">{BADGES[1].value}</p>
                      <p className="mt-1 text-xs font-medium text-cream-deep/80">{BADGES[1].label}</p>
                    </div>
                    <span className="flex items-center gap-1">
                      <span className="h-px flex-1 bg-white/25" />
                      <span className="h-1 w-8 rounded-full bg-white" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* compact badge row, mobile + small tablet only */}
            <div className="flex items-center justify-center gap-3 md:hidden">
              {BADGES.map(({ value, label, Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-forest-light/80">
                    <Icon className="h-4 w-4 text-cream-deep" strokeWidth={1.6} />
                  </span>
                  <div>
                    <span className="block text-sm font-bold leading-none text-white">{value}</span>
                    <span className="block text-[11px] text-cream-deep/80">{label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* description + CTA */}
            <p className="animate-fade-up mx-auto mt-[clamp(0.5rem,1.5svh,1.75rem)] max-w-md text-center text-[clamp(0.85rem,0.3vw_+_0.78rem,1rem)] leading-relaxed text-cream-deep/85">
              Wholesome oats with real vegetables, sealed fresh with Japanese retort technology. A nourishing meal, ready in minutes.
            </p>

            <div className="animate-fade-up mx-auto mt-[clamp(0.75rem,1.5svh,1.75rem)]">
              <Button
                href="#products"
                size="lg"
                className="group bg-white! text-forest! hover:bg-cream-deep!"
              >
                Explore Our Meals
                <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* notch strip — white panels cut into the bottom corners, tablet+ only */}
          
        </div>

        {/* mobile-only utility bar — sits below the panel with a soft wave cut */}
        <div className="hero-notch-mobile -mt-4 flex flex-col items-center gap-4 bg-white px-(--hero-inset) pb-6 pt-8 text-center md:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="tel:+918792799631"
              aria-label="Call Kaicho Foods"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-forest transition hover:bg-terracotta"
            >
              <IconPhone className="h-4 w-4" />
            </Link>
            <Link
              href="https://instagram.com"
              aria-label="Kaicho Foods on Instagram"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:border-brand hover:text-brand"
            >
              <IconInstagram className="h-4 w-4" />
            </Link>
          </div>
          <p className="max-w-xs text-sm text-ink-muted">
            Kaicho helps you eat wholesome, ready-to-eat meals without the wait.
          </p>

          <span className="h-px w-16 bg-ink/10" />

          <Link
            href="#products"
            className="group inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 py-1.5 pl-1.5 pr-4 text-xs font-bold uppercase tracking-wide text-forest transition hover:bg-gold/20"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-forest">
              <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
            Explore Meals
          </Link>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold leading-none text-forest">0%</p>
              <p className="mt-1 text-xs text-ink-muted">Preservatives, ever</p>
            </div>
            <span className="h-8 w-px bg-ink/10" />
            <Link
              href="#story"
              className="text-xs font-bold uppercase tracking-wide text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-brand"
            >
              Our Story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
