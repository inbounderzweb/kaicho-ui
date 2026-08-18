import CartPageClient from "../components/cart/CartPageClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Your Cart",
  description: "Review the items in your Kaicho cart before checkout.",
  path: "/cart",
  noIndex: true,
});

export default function CartPage() {
  return <CartPageClient />;
}
