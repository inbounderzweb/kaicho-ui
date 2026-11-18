import { notFound } from "next/navigation";
import SeoPageEditor from "../../../components/admin/seo/SeoPageEditor";
import SeoEntityPicker from "../../../components/admin/seo/SeoEntityPicker";
import { pageKeyFromSegment, isEntityKey } from "@/lib/seo/seoPageRoutes";

export default async function AdminSeoPageType({ params }: { params: Promise<{ pageType: string }> }) {
  const { pageType } = await params;
  const key = pageKeyFromSegment(pageType);
  if (!key) notFound();
  return isEntityKey(key) ? <SeoEntityPicker pageType={key} /> : <SeoPageEditor pageType={key} entityId={null} />;
}
