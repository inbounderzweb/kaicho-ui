import { Suspense } from "react";
import BrandsClient from "../../components/admin/BrandsClient";

export default function AdminBrandsPage() {
  return (
    <Suspense>
      <BrandsClient />
    </Suspense>
  );
}
