import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/api/client";
import type { PublicBlogListItem } from "@/lib/api/blogPublic";
import { IconArrowRight } from "../ui/icons";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogCard({
  post,
  imageSizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className = "",
}: {
  post: PublicBlogListItem;
  imageSizes?: string;
  className?: string;
}) {
  const href = `/blog/${post.slug}`;
  return (
    <article
      className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow hover:shadow-[0_20px_40px_-28px_rgba(28,28,28,0.3)] ${className}`}
    >
      <Link href={href} className="relative block aspect-[16/10] bg-brand-soft">
        {post.image ? (
          <Image
            src={resolveMediaUrl(post.image.mediumUrl ?? post.image.url)}
            alt={post.image.altText ?? post.title}
            fill
            sizes={imageSizes}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs font-semibold text-ink-faint">
            No image
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {post.category && (
            <Link href={`/blog/category/${post.category.slug}`} className="text-brand hover:underline">
              {post.category.name}
            </Link>
          )}
          {post.publishedAt && <span>{fmtDate(post.publishedAt)}</span>}
        </div>
        <h3 className="mt-2 line-clamp-2 break-words font-display text-base font-semibold leading-snug text-ink">
          <Link href={href} className="hover:text-brand">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-ink-faint">
          <span>{post.readingTimeMinutes > 0 ? `${post.readingTimeMinutes} min read` : ""}</span>
          <Link href={href} className="inline-flex items-center gap-1 font-semibold text-brand">
            Read
            <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
