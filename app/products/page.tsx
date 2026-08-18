import PageBanner from "../components/ui/PageBanner";
import ProductSection from "../components/sections/ProductSection";
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
      <ProductSection />
    </>
  );
}
