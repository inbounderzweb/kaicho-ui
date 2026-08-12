import Image from "next/image";
import Container from "../Container";
import { IconCart, IconTruck } from "../icons";

const HIGHLIGHTS = [
  {
    title: "Easy Ordering",
    desc: "Browse the full menu and place your order online in just a few taps.",
    Icon: IconCart,
  },
  {
    title: "Doorstep Delivery",
    desc: "Sealed fresh with Japanese retort technology and delivered straight to you.",
    Icon: IconTruck,
  },
];

export default function GetStarted() {
  return (
    <section className="bg-cream py-20 sm:py-24">
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-terracotta">
            Start With Healthy
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Get Started Today!
          </h2>
          <span aria-hidden className="mt-5 block h-1 w-16 rounded-full bg-brand" />

          <h3 className="mt-6 text-lg font-bold text-ink sm:text-xl">
            Everything you need for wholesome, ready-to-eat meals.
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
            From your first order to your next refill, Kaicho makes healthy
            eating simple — no prep, no mess, just heat and eat.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {HIGHLIGHTS.map(({ title, desc, Icon }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-4 sm:p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-base font-bold text-ink">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div aria-hidden className="absolute inset-[6%] rounded-full bg-brand-soft" />
          <div className="absolute inset-[10%] overflow-hidden rounded-full shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]">
            <Image
              src="/kaicho-lifestyle-banner.jpg"
              alt="Kaicho customer enjoying a warm bowl of porridge at home"
              fill
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
