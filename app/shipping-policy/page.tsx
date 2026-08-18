import LegalPage from "../components/legal/LegalPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Shipping Policy",
  description:
    "Delivery areas, timelines, shipping charges and tracking for Kaicho Foods orders.",
  path: "/shipping-policy",
});

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      title="Shipping Policy"
      description="Delivery areas, timelines and tracking for your Kaicho Foods order."
      breadcrumbLabel="Shipping Policy"
      breadcrumbHref="/shipping-policy"
      intro="We aim to deliver Kaicho Foods products to your doorstep in the safest and quickest way possible."
      sections={[
        {
          heading: "Delivery Areas",
          paragraphs: [
            "We currently deliver across India through reliable courier and logistics partners.",
          ],
        },
        {
          heading: "Delivery Time",
          paragraphs: [
            "Orders are usually processed within 1–2 business days and delivered within 3–7 business days, depending on your location.",
          ],
        },
        {
          heading: "Shipping Charges",
          paragraphs: [
            "Applicable shipping charges (if any) will be displayed at checkout. We may offer free shipping on certain orders as part of promotions.",
          ],
        },
        {
          heading: "Delays",
          paragraphs: [
            "While we strive to deliver on time, delays may occur due to courier issues, unforeseen events, or high demand. Kaicho Foods is not responsible for delays beyond our control.",
          ],
        },
        {
          heading: "Tracking",
          paragraphs: [
            "Once your order is shipped, you will receive tracking details via email or SMS.",
          ],
        },
        {
          heading: "Responsibility",
          paragraphs: [
            "Please ensure that the delivery address and contact details provided are accurate.",
            "Kaicho Foods will not be responsible for non-delivery due to incorrect information provided by the customer.",
          ],
        },
      ]}
    />
  );
}
