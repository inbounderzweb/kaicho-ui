import type { Metadata } from "next";
import ManagedPageSections from "@/app/components/seo/ManagedPageSections";
import { buildManagedMetadata } from "@/lib/seo/pageContent";
import { getPageContent } from "@/lib/seo/pageContent";
import BlogSection from "./components/sections/BlogSection";
import CategoryShowcase from "@/app/components/sections/CategoryShowcase";
import GetStarted from "./components/sections/GetStarted";
import Hero from "./components/sections/Hero";
import HowItWorks from "./components/sections/HowItWorks";
import StoryCover from "./components/sections/StoryCover";
import StorySection from "./components/sections/StorySection";
import PromiseSection from "./components/sections/PromiseSection";
import Testimonials from "./components/sections/Testimonials";
import UseCaseGrid from "./components/sections/UseCaseGrid";

// The homepage is served from cache and refreshed in the background at most
// once every 2 minutes — a burst of visitors hits a static file, not the
// backend + Mongo. New collections / blog posts appear within the window.
export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent("HOME");
  // Nothing managed (or backend down) → inherit the root layout's metadata untouched.
  if (!content?.seo.title && !content?.seo.description && !content?.seo.canonicalUrl && !content?.seo.ogTitle &&
      !content?.seo.ogDescription && !content?.seo.ogImageUrl && !content?.seo.keywords.length &&
      content?.seo.robotsIndex !== false && content?.seo.robotsFollow !== false) {
    return {};
  }
  const meta = await buildManagedMetadata("HOME", { path: "/" });
  // The home title is a complete title, not "%s | Kaicho Foods".
  return content?.seo.title ? { ...meta, title: { absolute: content.seo.title } } : { ...meta, title: undefined };
}

export default function Home() {
  return (
    <>
      <Hero />
      <GetStarted />
      {/* <WholesomeGoodness /> */}
      {/* <ProductSection /> */}
      <CategoryShowcase />
      <StorySection />
      <PromiseSection />
      <StoryCover />
      <HowItWorks />
      <UseCaseGrid />
      {/* <Testimonials /> */}
      <BlogSection />
      <ManagedPageSections pageType="HOME" />
    </>
  );
}
