const BLOG_IMAGE = "https://cdn.shopify.com/s/files/1/0768/7979/0338/files/card6_1.png?v=1779454715";

export type BlogPost = {
  slug: string;
  date: string;
  title: string;
  teaser: string;
  image: string;
};

export const POSTS: BlogPost[] = [
  {
    slug: "karkidaka-diet-mistakes",
    date: "Aug 01, 2026",
    title: "Common Mistakes to Avoid While Following a Karkidaka Diet",
    teaser: "The traditional Karkidakam cleanse works best when a few everyday habits are gotten right.",
    image: BLOG_IMAGE,
  },
  {
    slug: "navadhanya-kanji-superfood",
    date: "Jun 19, 2026",
    title: "Navadhanya Kanji: The Superfood for Karkidakam Month",
    teaser: "Nine grains, one bowl — the Malayalam calendar's monsoon staple, explained.",
    image: BLOG_IMAGE,
  },
  {
    slug: "veg-vs-chicken-oats-porridge",
    date: "Jun 08, 2026",
    title: "Veg Oats vs Chicken Oats Porridge: Which One Should You Choose?",
    teaser: "A quick comparison to help you pick the right bowl for your goals.",
    image: BLOG_IMAGE,
  },
  {
    slug: "oats-for-weight-loss",
    date: "Jun 08, 2026",
    title: "Is Oats Good for Weight Loss? Everything You Need to Know",
    teaser: "What the fiber and protein in oats actually do for your appetite.",
    image: BLOG_IMAGE,
  },
  {
    slug: "protein-simple-fix",
    date: "May 05, 2026",
    title: "Struggling to Get Enough Protein? Here's the Simple Fix",
    teaser: "Low energy and hair fall can often be traced back to one missing macro.",
    image: BLOG_IMAGE,
  },
  {
    slug: "retort-technology-explained",
    date: "Sep 18, 2025",
    title: "Retort Technology Explained: How Kaicho Keeps Meals Fresh",
    teaser: "No preservatives, no refrigeration — here's the Japanese process that makes it possible.",
    image: BLOG_IMAGE,
  },
];
