import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { resolveMediaUrl } from "@/lib/api/client";
import type { BlogImage, BlogFaq, BlogTocItem } from "@/lib/api/blog";
import BlogToc from "./BlogToc";

// The shared article renderer used by both the admin draft preview
// (BlogPreviewClient) and the public /blog/[slug] page. Presentational only —
// callers pass a normalized shape so drafts never need a public API.
export interface BlogArticleData {
  title: string;
  excerpt: string;
  contentHtml: string;
  category: { name: string; slug: string } | null;
  author: { name: string } | null;
  tags: { name: string; slug: string }[];
  featuredImage: BlogImage | null;
  readingTimeMinutes: number;
  tableOfContents: BlogTocItem[];
  faqs: BlogFaq[];
  publishedAt: string | null;
  updatedAt: string | null;
}

function fmt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogArticle({
  data,
  isPreview = false,
  children,
}: {
  data: BlogArticleData;
  isPreview?: boolean;
  children?: ReactNode;
}) {
  const published = fmt(data.publishedAt);
  const updated = fmt(data.updatedAt);
  const showUpdated = updated && updated !== published;

  return (
    <article className="mx-auto max-w-[1180px] px-5 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-ink">Blog</Link>
        {data.category && (
          <>
            <span>/</span>
            <Link href={`/blog/category/${data.category.slug}`} className="hover:text-ink">
              {data.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="truncate text-ink-muted">{data.title}</span>
      </nav>

      <header className="mt-5 max-w-3xl">
        {data.category && (
          <Link
            href={`/blog/category/${data.category.slug}`}
            className="text-xs font-semibold uppercase tracking-wide text-brand"
          >
            {data.category.name}
          </Link>
        )}
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">{data.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">{data.excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-faint">
          {data.author && <span className="font-semibold text-ink-muted">{data.author.name}</span>}
          {published && <span>{published}</span>}
          {showUpdated && <span>· Updated {updated}</span>}
          {data.readingTimeMinutes > 0 && <span>· {data.readingTimeMinutes} min read</span>}
        </div>
      </header>

      {data.featuredImage && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-brand-soft">
          <Image
            src={resolveMediaUrl(data.featuredImage.mediumUrl ?? data.featuredImage.url)}
            alt={data.featuredImage.altText ?? data.title}
            fill
            priority
            sizes="(min-width: 1024px) 1180px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          {/* Body — contentHtml is sanitized server-side (kaicho-be blog.sanitize.ts). */}
          <div className="blog-prose max-w-none" dangerouslySetInnerHTML={{ __html: data.contentHtml || "<p></p>" }} />

          {data.faqs.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-2xl font-bold text-ink">Frequently asked questions</h2>
              <dl className="mt-5 divide-y divide-border rounded-2xl border border-border">
                {data.faqs.map((faq, i) => (
                  <div key={i} className="p-5">
                    <dt className="font-display text-base font-semibold text-ink">{faq.question}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {data.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <span key={tag.slug} className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink-muted">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {children}
        </div>

        <aside className="order-first lg:order-none">
          <div className="lg:sticky lg:top-24">
            <BlogToc items={data.tableOfContents} />
            {isPreview && (
              <p className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-700">
                Draft preview — not visible to the public.
              </p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
