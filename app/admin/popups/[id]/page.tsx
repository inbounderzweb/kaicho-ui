import PopupEditorClient from "../../../components/admin/PopupEditorClient";

export default async function AdminPopupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PopupEditorClient id={id} />;
}
