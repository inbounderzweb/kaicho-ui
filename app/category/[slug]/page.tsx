import { cache, Suspense } from "react";
import { notFound } from "next/navigation";
import PageBanner from "../../components/ui/PageBanner";
import CategoryPageClient from "../../components/products/CategoryPageClient";
import ProductGrid from "../../components/products/ProductGrid";
import { fetchPublicCategoryBySlug } from "@/lib/api/publicCategories";
import { ApiError } from "@/lib/api/ApiError";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { resolveMediaUrl } from "@/lib/api/client";

// On-demand ISR (see products/[slug] for the rationale): the first hit to a
// category slug caches the page HTML for `revalidate` seconds. The product
// grid inside is client-fetched and stays live regardless.
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

const getCategory = cache(async (slug: string) => {
  try {
    const { category } = await fetchPublicCategoryBySlug(slug, { revalidate: 300 });
    return category;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return buildPageMetadata({ title: "Category Not Found", noIndex: true });
  }

  return buildPageMetadata({
    title: category.name,
    description: category.description || `Shop ${category.name} at Kaicho Foods.`,
    path: `/category/${slug}`,
    image: category.image ? { url: resolveMediaUrl(category.image.url), alt: category.name } : undefined,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  return (
    <>
      <PageBanner
        title={category.name}
        description={category.description ?? undefined}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: category.name, href: `/category/${slug}` },
        ]}
        {...(category.image ? { image: resolveMediaUrl(category.image.url) } : {})}
      />
      {/* Same useSearchParams()-needs-Suspense requirement as /products —
          see that page for the full explanation. */}
      <Suspense fallback={<ProductGrid items={[]} isLoading />}>
        <CategoryPageClient slug={slug} />
      </Suspense>
    </>
  );
}
