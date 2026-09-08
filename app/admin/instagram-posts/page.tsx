import { Suspense } from "react";
import InstagramPostsClient from "../../components/admin/InstagramPostsClient";

export default function AdminInstagramPostsPage() {
  return (
    <Suspense>
      <InstagramPostsClient />
    </Suspense>
  );
}
