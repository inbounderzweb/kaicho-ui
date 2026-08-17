import Image from "next/image";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { IconArrowRight } from "../ui/icons";

const BLOG_IMAGE = "https://cdn.shopify.com/s/files/1/0768/7979/0338/files/card6_1.png?v=1779454715";

const POSTS = [
  {
    date: "Aug 01, 2026",
    title: "Common Mistakes to Avoid While Following a Karkidaka Diet",
    teaser: "The traditional Karkidakam cleanse works best when a few everyday habits are gotten right.",
    image: BLOG_IMAGE,
  },
  {
    date: "Jun 19, 2026",
    title: "Navadhanya Kanji: The Superfood for Karkidakam Month",
    teaser: "Nine grains, one bowl — the Malayalam calendar's monsoon staple, explained.",
    image: BLOG_IMAGE,
  },
  {
    date: "Jun 08, 2026",
    title: "Veg Oats vs Chicken Oats Porridge: Which One Should You Choose?",
    teaser: "A quick comparison to help you pick the right bowl for your goals.",
    image: BLOG_IMAGE,
  },
  {
    date: "Jun 08, 2026",
    title: "Is Oats Good for Weight Loss? Everything You Need to Know",
    teaser: "What the fiber and protein in oats actually do for your appetite.",
    image: BLOG_IMAGE,
  },
  {
    date: "May 05, 2026",
    title: "Struggling to Get Enough Protein? Here's the Simple Fix",
    teaser: "Low energy and hair fall can often be traced back to one missing macro.",
    image: BLOG_IMAGE,
  },
  {
    date: "Sep 18, 2025",
    title: "Retort Technology Explained: How Kaicho Keeps Meals Fresh",
    teaser: "No preservatives, no refrigeration — here's the Japanese process that makes it possible.",
    image: BLOG_IMAGE,
  },
];

export default function BlogSection() {
  return (
    <section id="blog" className="bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow="Latest News" heading="Our Blog" />

        <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 sm:snap-none lg:grid-cols-3">
          {POSTS.map(({ date, title, teaser, image }) => (
            <article
              key={title}
              className="group flex w-[68vw] max-w-65 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(28,28,28,0.3)] sm:w-auto sm:max-w-none sm:shrink"
            >
              <div className="relative aspect-[16/10] bg-brand-soft">
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 68vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
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
