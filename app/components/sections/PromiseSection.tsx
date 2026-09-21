import Image from "next/image";
import Button from "../ui/Button";
import Container from "../ui/Container";
import { IconArrowRight, IconLeaf } from "../ui/icons";

export default function PromiseSection() {
  return (
    <section aria-labelledby="our-promise" className="bg-[#f7f2e9]">
      <Container>
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-80 sm:min-h-96 lg:min-h-[480px]">
            <Image
              src="/kaicho-lifestyle-banner.jpg"
              alt="Enjoying a nourishing bowl of Kaicho porridge at home"
              fill
              sizes="(min-width: 1280px) 608px, (min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
            <p className="absolute bottom-8 left-6 right-6 max-w-xs font-display text-3xl font-semibold leading-tight text-white sm:bottom-10 sm:left-10">
              A healthier tomorrow, together.
            </p>
          </div>
          <div className="relative isolate flex flex-col items-start justify-center overflow-hidden py-10 sm:py-14 lg:pl-12 lg:pr-6">
            <IconLeaf aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-12 -z-10 h-64 w-64 text-brand/10" />
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-brand" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand">Our Promise</span>
            </div>
            <h2 id="our-promise" className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Committed to a Better Tomorrow
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted">
              We promise that every Kaicho product will always live up to that
              promise with honest sourcing, clean ingredients and advanced
              packaging technology to ensure freshness, safety and convenience.
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
              We remain transparent, responsible, and dedicated to building trust
              with every customer who chooses Kaicho Foods.
            </p>
            <Button href="/products" className="mt-7">
              Explore Our Products
              <IconArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
