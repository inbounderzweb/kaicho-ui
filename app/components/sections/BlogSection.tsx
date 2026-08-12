import Container from "../Container";
import SectionHeading from "../SectionHeading";
import { IconArrowRight, IconFlame, IconLeaf, IconPackage, IconPulse, IconShieldCheck, IconWheat } from "../icons";

const POSTS = [
  {
    date: "Aug 01, 2026",
    title: "Common Mistakes to Avoid While Following a Karkidaka Diet",
    teaser: "The traditional Karkidakam cleanse works best when a few everyday habits are gotten right.",
    Icon: IconLeaf,
  },
  {
    date: "Jun 19, 2026",
    title: "Navadhanya Kanji: The Superfood for Karkidakam Month",
    teaser: "Nine grains, one bowl — the Malayalam calendar's monsoon staple, explained.",
    Icon: IconWheat,
  },
  {
    date: "Jun 08, 2026",
    title: "Veg Oats vs Chicken Oats Porridge: Which One Should You Choose?",
    teaser: "A quick comparison to help you pick the right bowl for your goals.",
    Icon: IconPulse,
  },
  {
    date: "Jun 08, 2026",
    title: "Is Oats Good for Weight Loss? Everything You Need to Know",
    teaser: "What the fiber and protein in oats actually do for your appetite.",
    Icon: IconFlame,
  },
  {
    date: "May 05, 2026",
    title: "Struggling to Get Enough Protein? Here's the Simple Fix",
    teaser: "Low energy and hair fall can often be traced back to one missing macro.",
    Icon: IconShieldCheck,
  },
  {
    date: "Sep 18, 2025",
    title: "Retort Technology Explained: How Kaicho Keeps Meals Fresh",
    teaser: "No preservatives, no refrigeration — here's the Japanese process that makes it possible.",
    Icon: IconPackage,
  },
];

export default function BlogSection() {
  return (
    <section id="blog" className="bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow="Latest News" heading="Our Blog" />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map(({ date, title, teaser, Icon }) => (
            <article
              key={title}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(28,28,28,0.3)]"
            >
              <div className="flex aspect-[16/10] items-center justify-center bg-brand-soft">
                <Icon className="h-10 w-10 text-brand" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {date}
                </span>
                <h3 className="mt-2 font-display text-[15px] font-semibold leading-snug text-ink">
                  {title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{teaser}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  Read More
                  <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
