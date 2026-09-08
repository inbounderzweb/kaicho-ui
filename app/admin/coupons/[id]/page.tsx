import { Suspense } from "react";
import CouponDetailClient from "../../../components/admin/CouponDetailClient";

export default async function AdminCouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense>
      <CouponDetailClient id={id} />
    </Suspense>
  );
}
