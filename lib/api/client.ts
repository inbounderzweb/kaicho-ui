import { ApiError } from "./ApiError";

const IS_BROWSER = typeof window !== "undefined";

// The real, absolute backend URL — used for server-side (SSR / route-handler)
// fetches, which have no origin to resolve a relative path against.
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

// In the browser we deliberately call the frontend's OWN origin ("/api/…")
// and let a next.config.ts rewrite proxy it to the backend. This keeps every
// request same-origin: no CORS preflight, no mixed-content when the site is
// served over HTTPS, and — critically for the dev-tunnel setup — the browser
// never talks to the tunnel directly, so it can't be served the tunnel's
// anti-abuse interstitial HTML in place of the API response.
const API_BASE_URL = IS_BROWSER ? "/api" : RAW_API_BASE;

// The backend's origin, without the /api suffix — for resolving the
// root-relative asset URLs it returns (e.g. "/uploads/media/..."). Always
// derived from the absolute value, never the relative browser one.
const API_ORIGIN = RAW_API_BASE.replace(/\/api\/?$/, "");

// Backend-served media (/uploads/media/...). On the server, an absolute URL
// (the next/image optimizer fetches it). In the browser, empty — so
// resolveMediaUrl yields a root-relative "/uploads/media/..." that the same
// next.config.ts rewrite proxies to the backend. Trailing slash trimmed so
// joining with a root-relative path never doubles the slash.
const RAW_MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || API_ORIGIN).replace(/\/$/, "");
const MEDIA_BASE_URL = IS_BROWSER ? "" : RAW_MEDIA_BASE;

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
  let parseFailed = false;
  try {
    body = await res.json();
  } catch {
    body = undefined;
    parseFailed = true;
  }

  if (!res.ok) {
    throw new ApiError(body?.message ?? "Something went wrong. Please try again.", res.status, body?.details);
  }

  // A 2xx whose body isn't the JSON envelope means something other than our
  // API answered (a proxy error page, a tunnel interstitial, an HTML 200).
  // Surface it instead of silently resolving with `undefined`.
  if (parseFailed && res.status !== 204) {
    throw new ApiError("The server returned an unexpected response. Please try again.", res.status);
  }

  return (body?.data as T) ?? (undefined as T);
}
