import { Suspense } from "react";
import CouponDetailClient from "../../../components/admin/CouponDetailClient";

export default function NewCouponPage() {
  return (
    <Suspense>
      <CouponDetailClient />
    </Suspense>
  );
}
