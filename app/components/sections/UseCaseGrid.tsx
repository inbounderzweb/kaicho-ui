import Container from "../Container";
import SectionHeading from "../SectionHeading";
import {
  IconClock,
  IconHome,
  IconLaptop,
  IconMoon,
  IconSuitcase,
  IconThermometer,
  IconTruck,
  IconUsers,
} from "../icons";

const USE_CASES = [
  { title: "Road Trips", copy: "Easy to carry, perfect on the go.", Icon: IconTruck },
  { title: "Running Late for Office?", copy: "Just heat and eat before you leave.", Icon: IconClock },
  { title: "Late Night Hunger?", copy: "Warm, filling meals anytime.", Icon: IconMoon },
  { title: "During Fever or Recovery", copy: "Light, comforting, and easy to eat.", Icon: IconThermometer },
  { title: "Hostel & PG Life", copy: "Simple meals without cooking hassle.", Icon: IconHome },
  { title: "Travel & Staycations", copy: "Easy to store and carry anywhere.", Icon: IconSuitcase },
  { title: "Busy Family Days", copy: "Simple meals for packed routines.", Icon: IconUsers },
  { title: "Work From Home", copy: "Quick meals between meetings.", Icon: IconLaptop },
];

export default function UseCaseGrid() {
  return (
    <section className="bg-cream py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Everyday Moments"
          heading="Where Kaicho Fits Into Your Day"
          subheading="Good food, ready when you need it."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          <div className="relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl bg-ink p-8 lg:min-h-full">
            <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full opacity-[0.15]" aria-hidden>
              <path d="M0 220 Q80 160 150 200 T300 170 V300 H0Z" fill="#00A861" />
              <path d="M0 260 Q100 210 200 250 T300 230 V300 H0Z" fill="#00A861" />
            </svg>
            <p className="relative font-display text-2xl font-semibold leading-snug text-white">
              Whenever life gets busy,
              <br />
              Kaicho is always ready.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {USE_CASES.map(({ title, copy, Icon }, i) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_16px_32px_-24px_rgba(28,28,28,0.3)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
