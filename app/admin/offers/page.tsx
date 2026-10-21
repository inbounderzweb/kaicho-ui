import { Suspense } from "react";
import OffersClient from "../../components/admin/OffersClient";

export default function AdminOffersPage() {
  return (
    <Suspense>
      <OffersClient />
    </Suspense>
  );
}
