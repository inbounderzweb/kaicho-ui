import PageBanner from "../components/ui/PageBanner";
import ContactSection from "../components/contact/ContactSection";
import ManagedPageSections from "@/app/components/seo/ManagedPageSections";
import { buildManagedMetadata } from "@/lib/seo/pageContent";

export async function generateMetadata() {
  return buildManagedMetadata("CONTACT", {
  title: "Contact Us",
  description:
    "Get in touch with Kaicho Foods for order, delivery, or product questions — call, email, WhatsApp or send us a message.",
  path: "/contact",
});
}

export default function ContactPage() {
  return (
    <>
      <PageBanner
        title="Contact Us"
        description="We'd love to hear from you — reach out with any questions or feedback."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]}
      />
      <ContactSection />
      <ManagedPageSections pageType="CONTACT" />
    </>
  );
}
