import { Suspense } from "react";
import CollectionsClient from "../../components/admin/CollectionsClient";

export default function AdminCollectionsPage() {
  return (
    <Suspense>
      <CollectionsClient />
    </Suspense>
  );
}
