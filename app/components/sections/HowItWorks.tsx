import Container from "../Container";
import { IconBowl, IconFlame, IconPackage } from "../icons";

const STEPS = [
  { step: "01", title: "Open the pack", Icon: IconPackage },
  { step: "02", title: "Heat the product", Icon: IconFlame },
  { step: "03", title: "Enjoy your meal", Icon: IconBowl },
];

export default function HowItWorks() {
  return (
    <section className="bg-ink py-16 sm:py-20">
      <Container>
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
              How It Works
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
              Simple as Heat &amp; Eat
            </h2>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STEPS.map(({ step, title, Icon }) => (
            <div key={step} className="flex items-center gap-5 px-8 py-8">
              <span className="font-display text-3xl font-bold text-brand">{step}</span>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                <Icon className="h-6 w-6" />
              </span>
              <span className="font-display text-lg font-semibold text-white">{title}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
