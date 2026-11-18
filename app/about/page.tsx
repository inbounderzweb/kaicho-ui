import PageBanner from "../components/ui/PageBanner";
import StorySection from "../components/sections/StorySection";
import ManagedPageSections from "@/app/components/seo/ManagedPageSections";
import { buildManagedMetadata } from "@/lib/seo/pageContent";

export async function generateMetadata() {
  return buildManagedMetadata("ABOUT", {
  title: "Our Story",
  description:
    "Learn about Kaicho Foods — natural ingredients, no preservatives, and Japanese retort technology behind every ready-to-eat meal.",
  path: "/about",
});
}

export default function AboutPage() {
  return (
    <>
      <PageBanner
        title="About Us"
        description="Food rooted in tradition, made for today — the story behind Kaicho Foods."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About", href: "/about" }]}
      />
      <StorySection />
      <ManagedPageSections pageType="ABOUT" />
    </>
  );
}
