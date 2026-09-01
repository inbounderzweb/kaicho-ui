"use client";

import Link from "next/link";
import { useBlogDetail } from "@/lib/hooks/admin/useBlogQueries";
import { ApiError } from "@/lib/api/ApiError";
import BlogArticle, { type BlogArticleData } from "../blog/BlogArticle";
import { IconChevronLeft } from "../ui/icons";

// Renders the shared <BlogArticle> against the admin (draft-inclusive) detail
// endpoint, inside AdminShell — which is already auth-gated. Drafts therefore
// never touch a public route or the public API.
export default function BlogPreviewClient({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useBlogDetail(id);
  const blog = data?.blog;

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />;
  }

  if (isError || !blog) {
    const st = error instanceof ApiError ? error.status : 0;
    return (
      <div className="rounded-2xl border border-admin-border bg-admin-card p-6 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <p className="text-sm font-semibold">
          {st === 404 ? "This post doesn't exist." : "Couldn't load this post."}
        </p>
      </div>
    );
  }

  const articleData: BlogArticleData = {
    title: blog.title,
    excerpt: blog.excerpt,
    contentHtml: blog.contentHtml,
    category: blog.category ? { name: blog.category.name, slug: blog.category.slug } : null,
    author: blog.author ? { name: blog.author.name } : null,
    tags: blog.tags.map((t) => ({ name: t.name, slug: t.slug })),
    featuredImage: blog.featuredImage,
    readingTimeMinutes: blog.readingTimeMinutes,
    tableOfContents: blog.tableOfContents,
    faqs: blog.faqs,
    publishedAt: blog.publishedAt,
    updatedAt: blog.updatedAt,
  };

  return (
    <div className="-m-4 bg-white text-ink lg:-m-8">
      <div className="border-b border-border px-5 py-3 lg:px-8">
        <Link
          href={`/admin/blogs/${id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <IconChevronLeft className="h-4 w-4" />
          Back to editor
        </Link>
      </div>
      <BlogArticle data={articleData} isPreview />
    </div>
  );
}
