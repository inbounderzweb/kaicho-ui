import BlogListLayout from "../components/blog/BlogListLayout";
import { fetchPublicBlogs, fetchPublicBlogCategories } from "@/lib/api/blogPublic";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BLOG_PAGE_SIZE } from "@/lib/blog-constants";

// Post list/categories are cached for a few minutes and refreshed in the
// background — a spike of readers hits the cache. (A new post appears within
// the window.) The `?q=`/`?category=` variants render dynamically but still
// reuse the per-URL Data Cache for their backend calls.
export const revalidate = 300;

type SearchParams = Promise<{ q?: string; category?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  return buildPageMetadata({
    title: q ? `Search: ${q} — Blog` : "Blog: Recipes & Nutrition Tips",
    description:
      "Recipes, nutrition tips and stories from the Kaicho kitchen — everything you need to eat well, the ready-to-eat way.",
    path: "/blog",
    // A search results view is thin/duplicative — keep it out of the index
    // but let canonical still point at /blog.
    noIndex: Boolean(q),
    canonical: "/blog",
  });
}

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, category } = await searchParams;
  const search = q?.trim() || undefined;

  const [list, categoriesRes] = await Promise.all([
    fetchPublicBlogs(
      { page: 1, pageSize: BLOG_PAGE_SIZE, search, category },
      { revalidate: 300 }
    ).catch(() => ({
      items: [],
      page: 1,
      pageSize: BLOG_PAGE_SIZE,
      total: 0,
    })),
    fetchPublicBlogCategories({ revalidate: 600 }).catch(() => ({ categories: [] })),
  ]);

  const isPlain = !search && !category;
  const featured = isPlain && list.items.length > 0 ? list.items[0] : null;
  const posts = featured ? list.items.slice(1) : list.items;
  const totalPages = Math.max(1, Math.ceil(list.total / BLOG_PAGE_SIZE));

  return (
    <BlogListLayout
      title="Read our latest blog"
      description="Recipes, nutrition tips and stories from the Kaicho kitchen."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Blog", href: "/blog" },
      ]}
      posts={posts}
      featured={featured}
      page={1}
      totalPages={totalPages}
      hrefForPage={(n) => (n <= 1 ? "/blog" : `/blog/page/${n}`)}
      categories={categoriesRes.categories}
      searchValue={search ?? ""}
      resultCount={list.total}
    />
  );
}
