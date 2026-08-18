import LegalPage from "../components/legal/LegalPage";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Terms of Service",
  description:
    "Read the Terms and Conditions for using the Kaicho Foods website and purchasing our products.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description="The terms and conditions for using our website and purchasing our products."
      breadcrumbLabel="Terms of Service"
      breadcrumbHref="/terms"
      numbered
      intro="Welcome to Kaicho Foods. By accessing and using our website (www.kaicho.in) and purchasing our products, you agree to the following Terms and Conditions. Please read them carefully."
      sections={[
        {
          heading: "Eligibility",
          paragraphs: [
            "You must be 18 years or older to purchase products from our website. By placing an order, you confirm that you are legally capable of entering into binding contracts.",
          ],
        },
        {
          heading: "Products",
          paragraphs: [
            "Kaicho Foods offers healthy food products such as Navadhanya Kanji, Mixed Millet Porridge, and other future launches. These are food products and not medicinal items. They should not be used as a substitute for medical treatment or professional advice.",
          ],
        },
        {
          heading: "Pricing",
          paragraphs: [
            "All prices listed on our website are inclusive of applicable taxes. Prices may change without prior notice, but confirmed orders will not be affected.",
          ],
        },
        {
          heading: "Orders",
          paragraphs: [
            "Placing an order on our website constitutes an offer to purchase. We reserve the right to accept or reject any order based on product availability or other factors.",
          ],
        },
        {
          heading: "Payment",
          paragraphs: [
            "Payments must be made through the available payment gateways. Kaicho Foods is not responsible for any transaction failures caused by third-party services.",
          ],
        },
        {
          heading: "Limitation of Liability",
          paragraphs: [
            "Kaicho Foods is not liable for any indirect, incidental, or consequential damages arising from the use of our products. All products are manufactured and packed under food safety standards.",
          ],
        },
        {
          heading: "Governing Law",
          paragraphs: [
            "These Terms shall be governed by and interpreted under the laws of India. Any disputes shall be subject to the jurisdiction of courts in Bangalore, Karnataka.",
          ],
        },
      ]}
    />
  );
}
