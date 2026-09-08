"use client";

import { useState } from "react";
import type { InstagramPostType } from "@/lib/api/instagramPost";

// A small live preview using Instagram's own `/embed/` endpoint in a plain
// iframe. Deliberately NOT embed.js + instgrm.embeds.process() — that path
// needs the blockquote visible at process time and doesn't survive being
// (re)mounted inside a modal, which is exactly where this is used.
//
// Browser-only, no API key, no scraping, no request from our server. The
// `/embed/` endpoint occasionally rate-limits and serves its own "may be
// broken / removed" page even for a valid public post; we can't detect that
// (cross-origin), so there's a manual "Reload preview" that re-fetches.
const FRAME_HEIGHT = 540;

export default function InstagramEmbed({
  shortCode,
  postType,
}: {
  shortCode: string;
  postType: InstagramPostType;
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const segment = postType === "REEL" ? "reel" : "p";
  const src = `https://www.instagram.com/${segment}/${encodeURIComponent(shortCode)}/embed/`;

  return (
    <div className="w-full max-w-[320px]">
      <div className="relative w-full" style={{ height: FRAME_HEIGHT }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-admin-border bg-admin-surface dark:border-admin-border-dark dark:bg-admin-surface-dark">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-admin-primary-dark/40 border-t-admin-primary-dark dark:border-admin-primary/30 dark:border-t-admin-primary" />
          </div>
        )}
        <iframe
          // Remount on shortcode OR manual reload so the frame re-fetches
          // rather than showing a stale / rate-limited response.
          key={`${src}#${reloadKey}`}
          src={src}
          title={`Instagram ${postType === "REEL" ? "reel" : "post"} ${shortCode}`}
          loading="lazy"
          scrolling="no"
          onLoad={() => setLoaded(true)}
          className="h-full w-full overflow-hidden rounded-xl border border-admin-border bg-white dark:border-admin-border-dark"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          setLoaded(false);
          setReloadKey((k) => k + 1);
        }}
        className="mt-1.5 text-xs font-semibold text-admin-primary-dark hover:underline dark:text-admin-primary"
      >
        Reload preview
      </button>
    </div>
  );
}
