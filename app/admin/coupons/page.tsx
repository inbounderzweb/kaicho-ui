import { Suspense } from "react";
import CouponsClient from "../../components/admin/CouponsClient";

export default function AdminCouponsPage() {
  return (
    <Suspense>
      <CouponsClient />
    </Suspense>
  );
}
