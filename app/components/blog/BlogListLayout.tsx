import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/api/client";
import type { PublicBlogListItem, PublicBlogCategory } from "@/lib/api/blogPublic";
import PageBanner from "../ui/PageBanner";
import { IconArrowRight, IconSearch } from "../ui/icons";
import BlogCard from "./BlogCard";
import BlogPagination from "./BlogPagination";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function FeaturedPost({ post }: { post: PublicBlogListItem }) {
  return (
    <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-brand-soft">
        {post.image && (
          <Image
            src={resolveMediaUrl(post.image.mediumUrl ?? post.image.url)}
            alt={post.image.altText ?? post.title}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </Link>
      <div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {post.category && (
            <Link href={`/blog/category/${post.category.slug}`} className="text-brand hover:underline">
              {post.category.name}
            </Link>
          )}
          {post.publishedAt && <span>{fmtDate(post.publishedAt)}</span>}
        </div>
        <h2 className="mt-2 font-display text-2xl font-bold leading-snug text-ink lg:text-[28px]">
          <Link href={`/blog/${post.slug}`} className="hover:text-brand">
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">{post.excerpt}</p>
        <div className="mt-4 text-xs text-ink-faint">
          {post.author?.name}
          {post.readingTimeMinutes > 0 && ` · ${post.readingTimeMinutes} min read`}
        </div>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
        >
          Read article
          <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function BlogListLayout({
  title,
  description,
  breadcrumbs,
  posts,
  featured = null,
  page,
  totalPages,
  hrefForPage,
  categories,
  activeCategorySlug = null,
  searchValue = "",
  resultCount,
}: {
  title: string;
  description?: string;
  breadcrumbs: { label: string; href: string }[];
  posts: PublicBlogListItem[];
  featured?: PublicBlogListItem | null;
  page: number;
  totalPages: number;
  hrefForPage: (n: number) => string;
  categories?: PublicBlogCategory[];
  activeCategorySlug?: string | null;
  searchValue?: string;
  resultCount?: number;
}) {
  return (
    <section className="pb-16 sm:pb-20">
      <PageBanner title={title} description={description} breadcrumbs={breadcrumbs} />

      <div className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-6 lg:px-8">
        {featured && (
          <div className="mb-14">
            <FeaturedPost post={featured} />
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
            {searchValue ? "Search results" : activeCategorySlug ? "Articles" : "All articles"}
          </h2>

          <form action="/blog" method="get" className="flex w-full items-center gap-2 rounded-full border border-border bg-white px-4 py-2 sm:w-[280px]">
            <IconSearch className="h-4 w-4 shrink-0 text-ink-faint" />
            <input
              type="search"
              name="q"
              defaultValue={searchValue}
              placeholder="Search articles..."
              aria-label="Search blog articles"
              className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </form>
        </div>

        {categories && categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/blog"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !activeCategorySlug ? "bg-brand text-white" : "bg-cream text-ink-muted hover:text-ink"
              }`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog/category/${c.slug}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategorySlug === c.slug ? "bg-brand text-white" : "bg-cream text-ink-muted hover:text-ink"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {searchValue && (
          <p className="mt-4 text-sm text-ink-muted">
            {resultCount ?? posts.length} {(resultCount ?? posts.length) === 1 ? "result" : "results"} for &ldquo;
            {searchValue}&rdquo;
          </p>
        )}

        {posts.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border py-20 text-center">
            <IconSearch className="mx-auto h-8 w-8 text-ink-faint" />
            <p className="mt-3 text-sm font-semibold text-ink">No articles found</p>
            <p className="mt-1 text-sm text-ink-muted">
              {searchValue ? "Try a different search term." : "Check back soon."}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
            <BlogPagination page={page} totalPages={totalPages} hrefForPage={hrefForPage} />
          </>
        )}
      </div>
    </section>
  );
}
