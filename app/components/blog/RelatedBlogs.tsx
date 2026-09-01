import type { PublicBlogListItem } from "@/lib/api/blogPublic";
import BlogCard from "./BlogCard";

export default function RelatedBlogs({ posts }: { posts: PublicBlogListItem[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="font-display text-2xl font-bold text-ink">Related reading</h2>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} imageSizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" />
        ))}
      </div>
    </section>
  );
}
