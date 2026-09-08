import InstagramPostDetailClient from "../../../components/admin/InstagramPostDetailClient";

export default async function AdminInstagramPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InstagramPostDetailClient id={id} />;
}
