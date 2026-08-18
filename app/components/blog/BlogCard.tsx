import Image from "next/image";
import { IconArrowRight } from "../ui/icons";
import type { BlogPost } from "./blog-data";

export default function BlogCard({
  post,
  imageSizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 68vw",
  className = "",
}: {
  post: BlogPost;
  imageSizes?: string;
  className?: string;
}) {
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(28,28,28,0.3)] ${className}`}
    >
      <div className="relative aspect-[16/10] bg-brand-soft">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes={imageSizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {post.date}
        </span>
        <h3 className="mt-2 font-display text-[15px] font-semibold leading-snug text-ink">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{post.teaser}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
          Read More
          <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}
