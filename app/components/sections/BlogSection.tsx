import Link from "next/link";
import BlogCard from "../blog/BlogCard";
import { fetchPublicBlogs } from "@/lib/api/blogPublic";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { IconArrowRight } from "../ui/icons";

export default async function BlogSection() {
  const { items } = await fetchPublicBlogs({ page: 1, pageSize: 3 }).catch(() => ({ items: [] }));

  // Nothing published yet — omit the section rather than show an empty rail.
  if (items.length === 0) return null;

  return (
    <section id="blog" className="bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow="Latest News" heading="Our Blog" />

        <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 sm:snap-none lg:grid-cols-3">
          {items.map((post) => (
            <BlogCard
              key={post.slug}
              post={post}
              className="w-[68vw] max-w-65 shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink"
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
          >
            View All Articles
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
