import { Suspense } from "react";
import OfferDetailClient from "../../../components/admin/OfferDetailClient";

export default async function AdminOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense>
      <OfferDetailClient id={id} />
    </Suspense>
  );
}
