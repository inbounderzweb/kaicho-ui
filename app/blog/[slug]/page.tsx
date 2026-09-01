import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import JsonLd from "../../components/seo/JsonLd";
import BlogArticle, { type BlogArticleData } from "../../components/blog/BlogArticle";
import RelatedBlogs from "../../components/blog/RelatedBlogs";
import { fetchPublicBlogBySlug, fetchRelatedBlogs, type PublicBlogDetail } from "@/lib/api/blogPublic";
import { ApiError } from "@/lib/api/ApiError";
import { resolveMediaUrl } from "@/lib/api/client";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { blogPostingJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/structured-data";

export const dynamic = "force-dynamic";

async function getBlog(
  slug: string
): Promise<{ blog: PublicBlogDetail; redirectedFrom: string | null } | null> {
  try {
    return await fetchPublicBlogBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getBlog(slug);
  if (!result) return buildPageMetadata({ title: "Post Not Found", noIndex: true });

  const { blog } = result;
  const ogImg = blog.seo.ogImage ?? blog.featuredImage;

  return buildPageMetadata({
    title: blog.seo.metaTitle || blog.title,
    description: blog.seo.metaDescription || blog.excerpt,
    path: `/blog/${blog.slug}`,
    canonical: blog.seo.canonicalUrl || `/blog/${blog.slug}`,
    noIndex: blog.seo.noIndex,
    noFollow: blog.seo.noFollow,
    ogType: "article",
    publishedTime: blog.publishedAt ?? undefined,
    modifiedTime: blog.updatedAt,
    image: ogImg
      ? { url: resolveMediaUrl(ogImg.url), alt: ogImg.altText ?? blog.title }
      : undefined,
  });
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getBlog(slug);
  if (!result) notFound();

  const { blog, redirectedFrom } = result;
  // Resolved via an old slug — 308 to the canonical URL so inbound links and
  // link equity move to the current path.
  if (redirectedFrom && blog.slug !== slug) {
    permanentRedirect(`/blog/${blog.slug}`);
  }

  const related = await fetchRelatedBlogs(blog.slug, 3)
    .then((r) => r.blogs)
    .catch(() => []);

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

  const emitFaqSchema = blog.schemaEnabled && blog.faqs.length > 0;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          ...(blog.category ? [{ name: blog.category.name, path: `/blog/category/${blog.category.slug}` }] : []),
          { name: blog.title, path: `/blog/${blog.slug}` },
        ])}
      />
      {blog.schemaEnabled && (
        <JsonLd
          data={blogPostingJsonLd({
            title: blog.title,
            description: blog.seo.metaDescription || blog.excerpt,
            slug: blog.slug,
            imageUrl: (blog.seo.ogImage ?? blog.featuredImage)?.url ?? null,
            authorName: blog.author?.name ?? null,
            datePublished: blog.publishedAt,
            dateModified: blog.updatedAt,
          })}
        />
      )}
      {emitFaqSchema && <JsonLd data={faqJsonLd(blog.faqs)} />}

      <BlogArticle data={articleData}>
        <RelatedBlogs posts={related} />

        <section className="mt-16 rounded-2xl bg-brand-soft px-6 py-10 text-center sm:px-10">
          <h2 className="font-display text-2xl font-bold text-ink">Eat well, the ready-to-eat way</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
            Diabetic-friendly, gut-healthy porridges made with Japanese retort technology. Heat and eat in minutes.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Shop the range
          </Link>
        </section>
      </BlogArticle>
    </>
  );
}
