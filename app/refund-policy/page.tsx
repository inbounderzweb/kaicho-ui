import LegalPage from "../components/legal/LegalPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Refund Policy",
  description:
    "Returns, replacements and refund eligibility for Kaicho Foods ready-to-eat products.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      description="Our guidelines for returns, replacements and refunds on food products."
      breadcrumbLabel="Refund Policy"
      breadcrumbHref="/refund-policy"
      intro="At Kaicho Foods, we put great care into making sure every product reaches you fresh, safe, and in perfect condition. Since our products are food items, we follow strict guidelines for returns and replacements."
      sections={[
        {
          heading: "What cannot be returned",
          bullets: [
            "We do not accept returns based on personal taste or preference.",
            "Once a food product has been opened or consumed, it cannot be returned.",
          ],
        },
        {
          heading: "When you can request a return or replacement",
          paragraphs: ["A product is eligible for return or replacement only if:"],
          bullets: [
            "It was damaged during delivery.",
            "It is expired or near expiry at the time of delivery.",
            "The packaging is tampered or not intact on arrival.",
            "There is any leakage or puffing of the pack. Do not consume such products.",
          ],
        },
        {
          heading: "Timeframe for raising a request",
          bullets: [
            "You must raise your return or replacement request within 48 hours of receiving your order.",
            "Please share clear photo or video proof of the issue to help us process your request faster.",
          ],
        },
        {
          heading: "Conditions for return or replacement",
          bullets: [
            "The product must be unopened, unused, and in its original packaging.",
            "If eligible, we will arrange a replacement product or a refund, depending on the situation.",
            "Products showing leakage or puffing will be replaced or refunded.",
          ],
        },
        {
          heading: "Our commitment",
          paragraphs: [
            "Your trust means everything to us. While we cannot accept returns for reasons related to taste, we are committed to resolving any genuine concerns quickly and fairly.",
          ],
        },
        {
          heading: "Customer support",
          paragraphs: [
            "For support, contact us at +91 87927 99631 between 10 am and 6 pm, Monday to Friday. We are closed on Saturdays and Sundays.",
          ],
        },
      ]}
    />
  );
}
