import { Suspense } from "react";
import SettingsClient from "../../components/admin/SettingsClient";

export default function AdminSettingsPage() {
  return (
    <Suspense>
      <SettingsClient />
    </Suspense>
  );
}
