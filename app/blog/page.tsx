import BlogPageClient from "../components/blog/BlogPageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Blog: Recipes & Nutrition Tips",
  description:
    "Recipes, nutrition tips and stories from the Kaicho kitchen — everything you need to eat well, the ready-to-eat way.",
  path: "/blog",
});

export default function BlogPage() {
  return <BlogPageClient />;
}
