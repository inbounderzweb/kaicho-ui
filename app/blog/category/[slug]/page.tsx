import { notFound } from "next/navigation";
import BlogListLayout from "../../../components/blog/BlogListLayout";
import {
  fetchPublicBlogs,
  fetchPublicBlogCategories,
  fetchPublicBlogCategoryBySlug,
} from "@/lib/api/blogPublic";
import { ApiError } from "@/lib/api/ApiError";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BLOG_PAGE_SIZE } from "@/lib/blog-constants";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ page?: string }>;

async function getCategory(slug: string) {
  try {
    const { category } = await fetchPublicBlogCategoryBySlug(slug);
    return category;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return buildPageMetadata({ title: "Category Not Found", noIndex: true });

  return buildPageMetadata({
    title: category.metaTitle || `${category.name} — Blog`,
    description: category.metaDescription || category.description || `Articles in ${category.name} from the Kaicho blog.`,
    path: `/blog/category/${category.slug}`,
    canonical: `/blog/category/${category.slug}`,
  });
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  const category = await getCategory(slug);
  if (!category) notFound();

  const [list, categoriesRes] = await Promise.all([
    fetchPublicBlogs({ page, pageSize: BLOG_PAGE_SIZE, category: slug }).catch(() => ({
      items: [],
      page,
      pageSize: BLOG_PAGE_SIZE,
      total: 0,
    })),
    fetchPublicBlogCategories().catch(() => ({ categories: [] })),
  ]);

  const totalPages = Math.max(1, Math.ceil(list.total / BLOG_PAGE_SIZE));
  if (list.total > 0 && page > totalPages) notFound();

  return (
    <BlogListLayout
      title={category.name}
      description={category.description ?? undefined}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Blog", href: "/blog" },
        { label: category.name, href: `/blog/category/${category.slug}` },
      ]}
      posts={list.items}
      page={page}
      totalPages={totalPages}
      hrefForPage={(n) => (n <= 1 ? `/blog/category/${slug}` : `/blog/category/${slug}?page=${n}`)}
      categories={categoriesRes.categories}
      activeCategorySlug={slug}
    />
  );
}
