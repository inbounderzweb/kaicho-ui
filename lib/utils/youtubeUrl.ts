// Client-side mirror of kaicho-be's youtubeUrl.ts — inline form feedback +
// the local preview only. The backend re-parses and is authoritative. Keep
// the two in sync.

export type YouTubeVideoType = "VIDEO" | "SHORT";

export interface ParsedYouTubeUrl {
  videoType: YouTubeVideoType;
  videoId: string;
  /** `https://www.youtube.com/watch?v={id}` or `.../shorts/{id}` */
  canonicalUrl: string;
}

export const MAX_YOUTUBE_URL_LENGTH = 2048;

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);

export function parseYouTubeUrl(raw: string): ParsedYouTubeUrl | null {
  const input = raw.trim();
  if (!input || input.length > MAX_YOUTUBE_URL_LENGTH) return null;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  let found: { id: string; type: YouTubeVideoType } | null = null;

  if (host === "youtu.be") {
    const m = /^\/([^/]+)\/?$/.exec(url.pathname);
    found = m ? { id: m[1], type: "VIDEO" } : null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === "/watch" || url.pathname === "/watch/") {
      const v = url.searchParams.get("v");
      found = v ? { id: v, type: "VIDEO" } : null;
    } else {
      let m = /^\/shorts\/([^/]+)\/?$/.exec(url.pathname);
      if (m) found = { id: m[1], type: "SHORT" };
      else {
        m = /^\/(?:embed|live|v)\/([^/]+)\/?$/.exec(url.pathname);
        if (m) found = { id: m[1], type: "VIDEO" };
      }
    }
  } else {
    return null;
  }

  if (!found || !VIDEO_ID_RE.test(found.id)) return null;

  return {
    videoType: found.type,
    videoId: found.id,
    canonicalUrl:
      found.type === "SHORT"
        ? `https://www.youtube.com/shorts/${found.id}`
        : `https://www.youtube.com/watch?v=${found.id}`,
  };
}
