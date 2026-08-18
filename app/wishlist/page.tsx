import WishlistPageClient from "../components/wishlist/WishlistPageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "My Wishlist",
  description: "View and manage the Kaicho products you've saved for later.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistPage() {
  return <WishlistPageClient />;
}
