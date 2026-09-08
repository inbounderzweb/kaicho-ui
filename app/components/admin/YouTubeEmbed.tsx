"use client";

import { useState } from "react";

// A small 16:9 preview using YouTube's official /embed/ endpoint in a plain
// iframe (youtube-nocookie so an admin preview doesn't set ad cookies).
// Browser-only, no API key, no scraping, no request from our server.
export default function YouTubeEmbed({ videoId }: { videoId: string }) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;

  return (
    <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl border border-admin-border bg-black dark:border-admin-border-dark">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-admin-surface dark:bg-admin-surface-dark">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-admin-primary-dark/40 border-t-admin-primary-dark dark:border-admin-primary/30 dark:border-t-admin-primary" />
          </div>
        )}
        <iframe
          key={src}
          src={src}
          title={`YouTube video ${videoId}`}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
