import { notFound, redirect } from "next/navigation";
import BlogListLayout from "../../../components/blog/BlogListLayout";
import { fetchPublicBlogs, fetchPublicBlogCategories } from "@/lib/api/blogPublic";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BLOG_PAGE_SIZE } from "@/lib/blog-constants";

export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ page: string }>;

function parsePage(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 2 ? n : null;
}

export async function generateMetadata({ params }: { params: Params }) {
  const { page } = await params;
  const n = parsePage(page);
  return buildPageMetadata({
    title: `Blog — Page ${n ?? ""}`.trim(),
    description: "Recipes, nutrition tips and stories from the Kaicho kitchen.",
    path: `/blog/page/${n ?? 2}`,
    // Each paginated page is canonical to itself — no duplicate-canonical
    // conflict with /blog.
    canonical: `/blog/page/${n ?? 2}`,
  });
}

export default async function BlogPaginatedPage({ params }: { params: Params }) {
  const { page } = await params;
  const n = parsePage(page);
  // "/blog/page/1" and garbage both belong at the canonical first page.
  if (n === null) redirect("/blog");

  const [list, categoriesRes] = await Promise.all([
    fetchPublicBlogs({ page: n, pageSize: BLOG_PAGE_SIZE }, { revalidate: 300 }).catch(() => ({
      items: [],
      page: n,
      pageSize: BLOG_PAGE_SIZE,
      total: 0,
    })),
    fetchPublicBlogCategories({ revalidate: 600 }).catch(() => ({ categories: [] })),
  ]);

  const totalPages = Math.max(1, Math.ceil(list.total / BLOG_PAGE_SIZE));
  if (list.total > 0 && n > totalPages) notFound();

  return (
    <BlogListLayout
      title="Read our latest blog"
      description="Recipes, nutrition tips and stories from the Kaicho kitchen."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Blog", href: "/blog" },
        { label: `Page ${n}`, href: `/blog/page/${n}` },
      ]}
      posts={list.items}
      page={n}
      totalPages={totalPages}
      hrefForPage={(p) => (p <= 1 ? "/blog" : `/blog/page/${p}`)}
      categories={categoriesRes.categories}
    />
  );
}
