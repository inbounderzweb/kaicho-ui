import YouTubeVideoDetailClient from "../../../components/admin/YouTubeVideoDetailClient";

export default async function AdminYouTubeVideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <YouTubeVideoDetailClient id={id} />;
}
