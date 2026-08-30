import CheckoutClient from "../components/checkout/CheckoutClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

// Transactional and per-customer (cart contents, saved addresses), so it's
// noIndex like /wishlist and /profile. The client component gates itself
// behind useRequireAuth(); the real enforcement is the requireAuth backend
// routes it calls.
export const metadata = buildPageMetadata({
  title: "Checkout",
  description: "Complete your Kaicho order.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}
