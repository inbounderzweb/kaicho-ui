import { Suspense } from "react";
import PageBanner from "../components/ui/PageBanner";
import ProductsPageClient from "../components/products/ProductsPageClient";
import ProductGrid from "../components/products/ProductGrid";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Ready-to-Eat Meals, Combos & Saver Packs",
  description:
    "Browse Kaicho Foods' ready-to-eat meals, combos and family saver packs — 100% natural, no preservatives, ready in minutes.",
  path: "/products",
});

export default function ProductsPage() {
  return (
    <>
      <PageBanner
        title="Our Products"
        description="Healthy, ready-to-eat meals, combos and saver packs for busy lifestyles."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }]}
      />
      {/* ProductsPageClient reads useSearchParams() (via useCatalogFilters)
          for its URL-driven filter state — the App Router requires that to
          be wrapped in Suspense, or a static prerender of this page fails
          the build entirely. The fallback is the same grid skeleton the
          client itself shows while its first fetch is in flight, so there's
          no visible flash between the two. */}
      <Suspense fallback={<ProductGrid items={[]} isLoading />}>
        <ProductsPageClient />
      </Suspense>
    </>
  );
}
