import Image from "next/image";
import Button from "../Button";
import Container from "../Container";
import {
  IconArrowRight,
  IconLeaf,
  IconPackage,
  IconShieldCheck,
} from "../icons";

const VALUES = [
  {
    number: "01",
    label: "Natural Ingredients",
    description: "Thoughtfully selected ingredients",
    Icon: IconLeaf,
  },
  {
    number: "02",
    label: "No Preservatives",
    description: "Clean and simple food",
    Icon: IconShieldCheck,
  },
  {
    number: "03",
    label: "Japanese Retort",
    description: "Sealed for freshness",
    Icon: IconPackage,
  },
];

export default function StorySection() {
  return (
    <section
      id="story"
      className="relative overflow-hidden bg-[#f6f5ef] py-24 sm:py-32"
    >
      <Container>
        {/* Header */}
        <div className="mb-14 flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-brand" />

              <span className="text-xs font-bold uppercase tracking-[0.25em] text-brand">
                Our Story
              </span>
            </div>
          </div>

          <span className="hidden text-xs font-semibold tracking-[0.2em] text-ink-muted sm:block">
            01 / 03
          </span>
        </div>

        {/* Main editorial layout */}
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* LEFT CONTENT */}
          <div className="max-w-xl">
            <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Food rooted in
              <span className="block text-brand">
                tradition.
              </span>
              Made for today.
            </h2>

            <p className="mt-7 max-w-lg text-base leading-8 text-ink-muted sm:text-lg">
              At Kaicho Foods, we believe wholesome food should fit naturally
              into modern life. We bring together time-honoured food traditions,
              carefully selected ingredients, and Japanese retort technology
              to create meals that are simple to enjoy and easy to share.
            </p>

            <div className="mt-9">
              <Button
                href="#b2b"
                variant="outline"
                size="lg"
                className="group"
              >
                Partner With Us
                <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Brand statement */}
            <div className="mt-14 border-l-2 border-brand pl-5">
              <p className="font-display text-lg font-semibold text-ink">
                Said. Served. Shared.
              </p>

              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Made with the care of a home-cooked meal.
              </p>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative">
            {/* Ambient glow */}
            <div
              className="
                absolute left-1/2 top-1/2
                h-[75%] w-[75%]
                -translate-x-1/2 -translate-y-1/2
                rounded-full
                bg-brand/10
                blur-3xl
              "
            />

            <div
              className="
                relative overflow-hidden
                rounded-[2rem]
                bg-[#e8e7df]
                p-6
                sm:p-10
              "
            >
              {/* Image */}
              <Image
                src="/kaicho-hero.png"
                alt="Kaicho ready-to-eat meal"
                width={1536}
                height={1024}
                sizes="(min-width: 1024px) 620px, 90vw"
                className="
                  relative z-10
                  mx-auto
                  h-auto
                  w-full
                  max-w-[620px]
                  object-contain
                  drop-shadow-[0_30px_40px_rgba(0,0,0,0.14)]
                  transition-transform
                  duration-700
                  hover:scale-[1.025]
                "
              />

              {/* Floating label */}
              <div
                className="
                  absolute
                  bottom-5 left-5
                  z-20
                  rounded-2xl
                  border border-white/60
                  bg-white/80
                  px-5 py-4
                  shadow-lg
                  backdrop-blur-md
                "
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                  Kaicho Philosophy
                </p>

                <p className="mt-1 font-display text-lg font-semibold text-ink">
                  Simple food. Thoughtfully made.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* VALUE RAIL */}
        <div
          className="
            mt-20
            grid
            divide-y divide-ink/10
            border-y border-ink/10
            sm:grid-cols-3
            sm:divide-x sm:divide-y-0
          "
        >
          {VALUES.map(({ number, label, description, Icon }) => (
            <div
              key={label}
              className="
                group
                flex items-center gap-5
                px-2 py-7
                sm:px-7
                lg:px-10
              "
            >
              <div
                className="
                  flex h-12 w-12 shrink-0
                  items-center justify-center
                  rounded-full
                  bg-brand/10
                  text-brand
                  transition-all duration-300
                  group-hover:bg-brand
                  group-hover:text-white
                "
              >
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-[0.15em] text-brand">
                    {number}
                  </span>

                  <h3 className="text-sm font-bold text-ink">
                    {label}
                  </h3>
                </div>

                <p className="mt-1 text-xs text-ink-muted">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}