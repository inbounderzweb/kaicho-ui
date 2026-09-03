import BlogSection from "./components/sections/BlogSection";
import CategoryShowcase from "@/app/components/sections/CategoryShowcase";
import GetStarted from "./components/sections/GetStarted";
import Hero from "./components/sections/Hero";
import HowItWorks from "./components/sections/HowItWorks";
import StoryCover from "./components/sections/StoryCover";
import StorySection from "./components/sections/StorySection";
import Testimonials from "./components/sections/Testimonials";
import UseCaseGrid from "./components/sections/UseCaseGrid";

// The homepage is served from cache and refreshed in the background at most
// once every 2 minutes — a burst of visitors hits a static file, not the
// backend + Mongo. New collections / blog posts appear within the window.
export const revalidate = 120;

export default function Home() {
  return (
    <>
      <Hero />
      <GetStarted />
      {/* <WholesomeGoodness /> */}
      {/* <ProductSection /> */}
      <CategoryShowcase />
      <StorySection />
      <StoryCover />
      <HowItWorks />
      <UseCaseGrid />
      {/* <Testimonials /> */}
      <BlogSection />
    </>
  );
}
