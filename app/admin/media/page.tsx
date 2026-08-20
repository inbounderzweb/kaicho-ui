import { Suspense } from "react";
import MediaLibraryClient from "../../components/admin/MediaLibraryClient";

export default function AdminMediaPage() {
  return (
    <Suspense>
      <MediaLibraryClient />
    </Suspense>
  );
}
