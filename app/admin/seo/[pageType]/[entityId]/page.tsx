import { notFound } from "next/navigation";
import SeoPageEditor from "../../../../components/admin/seo/SeoPageEditor";
import { pageKeyFromSegment, isEntityKey } from "@/lib/seo/seoPageRoutes";

export default async function AdminSeoEntityPage({
  params,
}: {
  params: Promise<{ pageType: string; entityId: string }>;
}) {
  const { pageType, entityId } = await params;
  const key = pageKeyFromSegment(pageType);
  if (!key || !isEntityKey(key)) notFound();
  return <SeoPageEditor pageType={key} entityId={entityId} />;
}
