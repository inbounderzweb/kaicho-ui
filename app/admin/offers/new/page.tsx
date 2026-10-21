import { Suspense } from "react";
import OfferDetailClient from "../../../components/admin/OfferDetailClient";

export default function NewOfferPage() {
  return (
    <Suspense>
      <OfferDetailClient />
    </Suspense>
  );
}
