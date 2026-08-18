"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import BlogCard from "./BlogCard";
import Pagination from "./Pagination";
import { POSTS } from "./blog-data";
import PageBanner from "../ui/PageBanner";
import { IconArrowRight, IconSearch } from "../ui/icons";

const POSTS_PER_PAGE = 4;

export default function BlogPageClient() {
  const [featuredPost, ...otherPosts] = POSTS;

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return otherPosts;
    return otherPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(q) || post.teaser.toLowerCase().includes(q)
    );
  }, [query, otherPosts]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <section className="pb-16 sm:pb-20">
      <PageBanner
        title="Read our latest blog"
        description="Recipes, nutrition tips and stories from the Kaicho kitchen."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }]}
      />

      <div className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-6 lg:px-8">
        {/* Featured post */}
        <div className="mt-8 grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-brand-soft">
            <Image
              src={featuredPost.image}
              alt={featuredPost.title}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {featuredPost.date}
            </span>
            <h2 className="mt-2 font-display text-xl font-bold leading-snug text-ink sm:text-2xl lg:text-[28px]">
              {featuredPost.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
              {featuredPost.teaser}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
              Read article
              <IconArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* All articles */}
        <div className="mt-14 sm:mt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
              All Articles
            </h2>

            <div className="flex w-full items-center gap-2 rounded-full border border-border bg-white px-4 py-2 sm:w-[280px]">
              <IconSearch className="h-4 w-4 shrink-0 text-ink-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search articles..."
                aria-label="Search blog articles"
                className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
          </div>

          {query && (
            <p className="mt-4 text-sm text-ink-muted">
              {filteredPosts.length} {filteredPosts.length === 1 ? "result" : "results"} for
              &ldquo;{query}&rdquo;
            </p>
          )}

          {paginatedPosts.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border py-20 text-center">
              <IconSearch className="mx-auto h-8 w-8 text-ink-faint" />
              <p className="mt-3 text-sm font-semibold text-ink">No articles found</p>
              <p className="mt-1 text-sm text-ink-muted">Try a different search term.</p>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {paginatedPosts.map((post) => (
                  <BlogCard
                    key={post.slug}
                    post={post}
                    imageSizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                ))}
              </div>

              <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
