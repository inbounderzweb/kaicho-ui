import BlogEditorClient from "../../../components/admin/BlogEditorClient";

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogEditorClient id={id} />;
}
