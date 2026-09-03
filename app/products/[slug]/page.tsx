import { cache } from "react";
import { notFound } from "next/navigation";
import JsonLd from "../../components/seo/JsonLd";
import ProductDetailClient from "../../components/products/ProductDetailClient";
import { fetchPublicProductBySlug } from "@/lib/api/publicProducts";
import { ApiError } from "@/lib/api/ApiError";
import { resolveMediaUrl } from "@/lib/api/client";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo/structured-data";

// The catalog changes continuously, so nothing is pre-rendered at build
// time — but returning [] here (with the default dynamicParams: true) turns
// this route into on-demand ISR: the first visitor to a slug renders it and
// the full HTML is cached for `revalidate` seconds, so the next 99 visitors
// in that minute get a static file and never touch the render server or
// Mongo. A background re-render keeps it fresh.
export const revalidate = 60;
export function generateStaticParams() {
  return [];
}

// cache() de-dupes: generateMetadata and the page body both call getProduct,
// but only one backend round-trip happens per request.
const getProduct = cache(async (slug: string) => {
  try {
    const { product } = await fetchPublicProductBySlug(slug, { revalidate: 60 });
    return product;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return buildPageMetadata({ title: "Product Not Found", noIndex: true });
  }

  return buildPageMetadata({
    title: product.seo.title || product.name,
    description: product.seo.description || product.shortDescription,
    path: `/products/${slug}`,
    image: product.images[0]
      ? { url: resolveMediaUrl(product.images[0].url), alt: product.images[0].altText }
      : undefined,
  });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          ...(product.category ? [{ name: product.category.name, path: `/category/${product.category.slug}` }] : []),
          { name: product.name, path: `/products/${slug}` },
        ])}
      />
      <JsonLd
        data={productJsonLd({
          name: product.name,
          description: product.shortDescription,
          sku: product.sku,
          slug: product.slug,
          images: product.images.map((img) => img.url),
          pricing: product.pricing,
          inStock: product.inventory.inStock,
          brandName: product.brand?.name,
        })}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
