import BlogSection from "./components/sections/BlogSection";
import CategoryShowcase from "./components/sections/CategoryShowcase";
import GetStarted from "./components/sections/GetStarted";
import Hero from "./components/sections/Hero";
import HowItWorks from "./components/sections/HowItWorks";
import ProductSection from "./components/sections/ProductSection";
import StoryCover from "./components/sections/StoryCover";
import StorySection from "./components/sections/StorySection";
import Testimonials from "./components/sections/Testimonials";
import UseCaseGrid from "./components/sections/UseCaseGrid";
import WholesomeGoodness from "./components/sections/WholesomeGoodness";

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
      <Testimonials />
      <BlogSection />
    </>
  );
}
