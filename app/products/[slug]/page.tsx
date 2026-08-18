import { notFound } from "next/navigation";
import JsonLd from "../../components/seo/JsonLd";
import ProductDetailClient from "../../components/products/ProductDetailClient";
import { PRODUCT_DETAILS } from "../../components/products/product-detail-content";
import { ALL_PRODUCTS, getProductBySlug } from "../../components/sections/product-data";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/structured-data";

export function generateStaticParams() {
  return ALL_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return buildPageMetadata({ title: "Product Not Found", noIndex: true });
  }

  const details = PRODUCT_DETAILS[slug];

  return buildPageMetadata({
    title: product.name,
    description: details?.shortDescription ?? `${product.name} — ${product.tags.join(", ")}. Rs. ${product.price.toFixed(2)}.`,
    path: `/products/${slug}`,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const details = PRODUCT_DETAILS[slug];
  const relatedProducts = ALL_PRODUCTS.filter((p) => p.slug !== slug).slice(0, 4);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          { name: product.name, path: `/products/${slug}` },
        ])}
      />
      <JsonLd
        data={productJsonLd({
          name: product.name,
          description: details?.shortDescription ?? `${product.name} — ${product.tags.join(", ")}.`,
          price: product.price,
          slug,
        })}
      />
      <ProductDetailClient product={product} details={details} relatedProducts={relatedProducts} />
    </>
  );
}
