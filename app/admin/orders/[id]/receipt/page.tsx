import OrderReceiptClient from "@/app/components/admin/OrderReceiptClient";

export default async function AdminOrderReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderReceiptClient id={id} />;
}
