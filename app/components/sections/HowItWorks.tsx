import Container from "../ui/Container";
import { IconBowl, IconFlame, IconPackage } from "../ui/icons";

const STEPS = [
  { step: "01", title: "Open the pack", Icon: IconPackage },
  { step: "02", title: "Heat the product", Icon: IconFlame },
  { step: "03", title: "Enjoy your meal", Icon: IconBowl },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 bg-fixed">
      <Container>
        {/* bg-fixed reuses the same pinned-background technique as Hero/StoryCover */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-forest sm:flex-row md:bg-[url('/desktop-coverimage.png')]">
          {/* ink, not forest — forest is literally the same color as the
              brand-green panel to its left, so a forest-tinted overlay left
              the marquee area indistinguishable from that panel */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/75" />

          <div className="relative z-10 flex shrink-0 flex-col justify-center bg-brand px-8 py-6 sm:w-64 sm:px-10 sm:py-8">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/85">
              How It Works
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
              Simple as Heat &amp; Eat
            </h2>
          </div>

          {/* auto-scrolling, right-to-left, infinite: steps list rendered twice
              back-to-back and translated by exactly 50%, so the loop is seamless */}
          <div className="relative z-10 flex flex-1 items-center overflow-hidden py-7 sm:py-0">
            <div className="animate-marquee flex w-max items-center gap-10">
              {[...STEPS, ...STEPS].map(({ step, title, Icon }, i) => (
                <div key={i} className="flex shrink-0 items-center gap-10">
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
                  <span aria-hidden className="h-10 w-px shrink-0 bg-white/15" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
