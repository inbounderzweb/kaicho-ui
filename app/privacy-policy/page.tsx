import LegalPage from "../components/legal/LegalPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how Kaicho Foods collects, uses, and protects your personal information.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="How we collect, use and protect your personal information."
      breadcrumbLabel="Privacy Policy"
      breadcrumbHref="/privacy-policy"
      lastUpdated="September 17, 2025"
      intro="At Kaicho Foods, we respect your privacy and are committed to protecting your personal information."
      sections={[
        {
          heading: "Information We Collect",
          paragraphs: [
            "We collect information you provide during checkout, such as your name, email address, phone number, and delivery address. We may also collect payment information through secure payment gateways.",
          ],
        },
        {
          heading: "How We Use Information",
          paragraphs: [
            "Your data is used solely for order processing, delivery, customer support, and sending updates about our products and offers (if you opt in).",
          ],
        },
        {
          heading: "Data Security",
          paragraphs: [
            "We use secure systems and encryption to protect your personal data. We do not sell, rent, or share your personal information with third parties except logistics and payment providers necessary to complete your order.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "Our website may use cookies to improve user experience. You can choose to disable cookies in your browser settings.",
          ],
        },
        {
          heading: "Your Rights",
          paragraphs: [
            "You can request access, correction, or deletion of your personal information by contacting us at support@kaicho.in.",
          ],
        },
      ]}
    />
  );
}
