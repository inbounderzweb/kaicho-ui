import BlogCategoriesClient from "../../../../components/admin/BlogCategoriesClient";

export default async function AdminBlogCategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogCategoriesClient editId={id} />;
}
