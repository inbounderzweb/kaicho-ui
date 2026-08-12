import Button from "../Button";
import Container from "../Container";
import { IconArrowRight, IconLeaf, IconPackage, IconShieldCheck } from "../icons";

const VALUES = [
  { label: "100% Natural Ingredients", Icon: IconLeaf },
  { label: "Zero Preservatives", Icon: IconShieldCheck },
  { label: "Japanese Retort Sealed", Icon: IconPackage },
];

export default function StorySection() {
  return (
    <section id="story" className="bg-white py-20 sm:py-24">
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
            Our Story
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Kaicho Foods
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
            At Kaicho Foods, we believe food is more than just nourishment —
            it is culture, care, and connection. Rooted in tradition yet
            designed for modern lifestyles, our mission is to make healthy
            eating simple, accessible, and enjoyable for everyone.
          </p>

          <ul className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            {VALUES.map(({ label, Icon }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-ink">{label}</span>
              </li>
            ))}
          </ul>

          <Button href="#b2b" variant="outline" size="lg" className="mt-10">
            Partner With Us
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-soft p-10 sm:p-14">
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
              <defs>
                <pattern id="grain" width="26" height="26" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="4" r="1.6" fill="#00A861" />
                  <circle cx="16" cy="14" r="1.2" fill="#00A861" />
                </pattern>
              </defs>
              <rect width="200" height="200" fill="url(#grain)" />
            </svg>

            <div className="relative flex flex-col items-center text-center">
              <svg viewBox="0 0 220 220" className="h-44 w-44 sm:h-56 sm:w-56">
                <circle cx="110" cy="110" r="100" fill="#FFFFFF" />
                <path
                  d="M60 130h100a50 30 0 0 1 -100 0Z"
                  fill="#00A861"
                />
                <path
                  d="M40 100a70 26 0 0 1 140 0"
                  fill="none"
                  stroke="#00A861"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <g fill="#00A861" opacity="0.6">
                  <circle cx="78" cy="146" r="3" />
                  <circle cx="98" cy="154" r="2.5" />
                  <circle cx="122" cy="152" r="3" />
                  <circle cx="142" cy="144" r="2.5" />
                </g>
              </svg>

              <p className="mt-6 font-display text-xl font-bold text-ink sm:text-2xl">
                Said. Served. Shared.
              </p>
              <p className="mt-2 max-w-[26ch] text-sm text-ink-muted">
                Every Kaicho pouch is prepared, sealed, and shared with the
                same care you&apos;d put into a home-cooked bowl.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
