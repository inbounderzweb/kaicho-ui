import CollectionDetailClient from "../../../components/admin/CollectionDetailClient";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CollectionDetailClient id={id} />;
}
