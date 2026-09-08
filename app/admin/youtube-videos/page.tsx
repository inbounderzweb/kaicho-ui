import { Suspense } from "react";
import YouTubeVideosClient from "../../components/admin/YouTubeVideosClient";

export default function AdminYouTubeVideosPage() {
  return (
    <Suspense>
      <YouTubeVideosClient />
    </Suspense>
  );
}
