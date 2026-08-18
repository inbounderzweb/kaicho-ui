import Image from "next/image";
import Button from "../ui/Button";
import Container from "../ui/Container";
import { IconArrowRight } from "../ui/icons";

export default function WholesomeGoodness() {
  return (
    <section className="bg-[#f5f5f5] py-16 sm:py-20">
      <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Wholesome Goodness
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-black sm:text-4xl">
            Nourishment Rooted
            <br />
            in <span className="text-brand">Tradition</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-black/70">
            Crafted with care using time-honored grains and modern technology
            to bring you the best of both worlds.
          </p>
          <Button href="/about" variant="outline" size="lg" className="mt-8">
            Learn More
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
          <Image
            src="/kaicho-lifestyle-banner.jpg"
            alt="Woman enjoying a bowl of Kaicho Chicken Oats Porridge beside the ready-to-eat pouch in her kitchen"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </Container>
    </section>
  );
}
