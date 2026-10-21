import { Suspense } from "react";
import PopupsClient from "../../components/admin/PopupsClient";

export default function AdminPopupsPage() {
  return (
    <Suspense>
      <PopupsClient />
    </Suspense>
  );
}
