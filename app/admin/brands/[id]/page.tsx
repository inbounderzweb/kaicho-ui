import BrandDetailClient from "../../../components/admin/BrandDetailClient";

export default async function AdminBrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BrandDetailClient id={id} />;
}
