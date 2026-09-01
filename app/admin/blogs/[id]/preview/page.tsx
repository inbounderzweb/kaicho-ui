import BlogPreviewClient from "../../../../components/admin/BlogPreviewClient";

export default async function AdminBlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogPreviewClient id={id} />;
}
