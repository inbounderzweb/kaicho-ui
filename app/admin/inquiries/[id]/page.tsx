import InquiryDetailClient from "../../../components/admin/InquiryDetailClient";

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InquiryDetailClient id={id} />;
}
