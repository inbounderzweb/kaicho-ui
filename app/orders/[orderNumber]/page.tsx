import OrderDetailClient from "../../components/orders/OrderDetailClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

// Thin server shell: the order itself is per-customer and behind
// requireAuth, so it's fetched client-side (with the session cookie) rather
// than server-rendered, and the page is noIndex like the rest of the
// account area. No generateStaticParams — order numbers aren't public.
export async function generateMetadata({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return buildPageMetadata({
    title: `Order ${orderNumber}`,
    description: "Track the status of your Kaicho order.",
    path: `/orders/${orderNumber}`,
    noIndex: true,
  });
}

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderDetailClient orderNumber={orderNumber} />;
}
