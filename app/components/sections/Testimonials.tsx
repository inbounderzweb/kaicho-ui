import Container from "../Container";
import SectionHeading from "../SectionHeading";
import { IconQuote, IconStar } from "../icons";

const TESTIMONIALS = [
  {
    quote:
      "Kaicho has become part of my morning routine — it's warm, filling, and doesn't spike my sugar levels. Ready in minutes, tastes homemade.",
    name: "Priya R.",
    place: "Bengaluru, Karnataka",
  },
  {
    quote:
      "I was skeptical about ready-to-eat food, but the Navadhanya Porridge genuinely tastes like it was made at home. Gentle on my stomach too.",
    name: "Arun P.",
    place: "Chennai, Tamil Nadu",
  },
  {
    quote:
      "Perfect for my hostel life — no cooking, no mess, just heat and eat. The Chicken Oats Porridge is my go-to after late study sessions.",
    name: "Sureesh K.",
    place: "Kannur, Kerala",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-cream py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow="Testimonials" heading="What Our Customers Say" />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, place }) => (
            <figure
              key={name}
              className="flex flex-col rounded-2xl border border-border bg-white p-7"
            >
              <IconQuote className="h-7 w-7 text-brand/40" />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-muted">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <div className="mt-5 flex items-center gap-1 text-brand">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IconStar key={i} className="h-3.5 w-3.5" />
                ))}
              </div>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft font-display text-sm font-bold text-brand">
                  {name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{name}</span>
                  <span className="block text-xs text-ink-faint">{place}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
