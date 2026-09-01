import { ApiError } from "./ApiError";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

// The backend's origin, without the /api suffix — for resolving the
// root-relative asset URLs it returns (e.g. "/uploads/media/..."), which
// are only valid against the backend's own origin, not wherever the
// frontend happens to be served from.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// One reusable base URL for backend-served media (/uploads/media/...).
// Kept as its own env var so it can point somewhere other than the API
// origin — e.g. hit the backend directly at http://localhost:4000 while
// API calls go through a dev tunnel, so next/image's server-side fetch
// never depends on the tunnel. Falls back to the API origin when unset,
// so existing setups keep working. Trailing slash trimmed so joining with
// a root-relative "/uploads/..." path never doubles the slash.
const MEDIA_BASE_URL = (
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL || API_ORIGIN
).replace(/\/$/, "");

export function resolveMediaUrl(url: string): string {
  if (/^https?:\/\//.test(url)) {
    // Already absolute. But backend media ("/uploads/...") may have been
    // persisted against a *different* backend origin than the one
    // configured now — e.g. a cart item added while
    // NEXT_PUBLIC_MEDIA_BASE_URL was http://localhost:4000, then reopened
    // after it moved to a dev tunnel. next/image rejects any host not in
    // next.config.ts's remotePatterns (which track the current env), so a
    // stale "/uploads/" URL would crash the whole page. Re-point it at
    // the current MEDIA_BASE_URL. Non-backend absolutes (Shopify CDN,
    // kaicho.in) don't live under "/uploads/" and pass through untouched.
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${MEDIA_BASE_URL}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Not a parseable URL — leave it as-is.
    }
    return url;
  }
  return `${MEDIA_BASE_URL}${url}`;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  details?: unknown;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let body: ApiResponse<T> | undefined;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }

  if (!res.ok) {
    throw new ApiError(body?.message ?? "Something went wrong. Please try again.", res.status, body?.details);
  }

  return (body?.data as T) ?? (undefined as T);
}
