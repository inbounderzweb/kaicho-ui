import Button from "../Button";
import Container from "../Container";
import { IconArrowRight } from "../icons";
import WholesomeArt from "./WholesomeArt";

export default function WholesomeGoodness() {
  return (
    <section className="bg-[#0B2015] py-16 sm:py-20">
      <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Wholesome Goodness
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            Nourishment Rooted
            <br />
            in <span className="text-brand">Tradition</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            Crafted with care using time-honored grains and modern technology
            to bring you the best of both worlds.
          </p>
          <Button href="#story" variant="outline-light" size="lg" className="mt-8">
            Learn More
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
          <div className="aspect-[4/3] w-full">
            <WholesomeArt />
          </div>
        </div>
      </Container>
    </section>
  );
}
