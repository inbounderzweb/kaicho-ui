import PageBanner from "../components/ui/PageBanner";
import StoryCover from "../components/sections/StoryCover";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Bulk Orders & B2B",
  description:
    "Planning a corporate order, reselling or catering event? Get bulk pricing on Kaicho Foods' ready-to-eat meals.",
  path: "/b2b",
});

export default function B2BPage() {
  return (
    <>
      <PageBanner
        title="Bulk Orders & B2B"
        description="Corporate orders, reselling, events and catering — let's talk bulk pricing."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "B2B", href: "/b2b" }]}
      />
      <StoryCover />
    </>
  );
}
