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

// Backend-served media (/uploads/media/...) is ALWAYS addressed with a
// root-relative path — on the server and in the browser alike. next.config.ts's
// `beforeFiles` rewrite proxies "/uploads/media/*" to the backend for every
// caller: the browser (kept same-origin — no CORS, no mixed content, no
// dev-tunnel interstitial) and the server-side next/image optimizer, which
// resolves the relative path against the app's own origin and then hits that
// same rewrite.
//
// This MUST return one identical value on the server and in the browser:
// next/image bakes the resolved src into the SSR-ed src/srcSet, so any
// server/client difference here surfaces as a React hydration mismatch on
// every product card, gallery and cart image. (For absolute OG-image /
// JSON-LD URLs, callers wrap the result in absoluteUrl() — see lib/seo.)
export function resolveMediaUrl(url: string): string {
  if (/^https?:\/\//.test(url)) {
    // Already absolute. A backend media URL ("/uploads/...") may have been
    // persisted against a *different* origin than the one configured now —
    // e.g. a cart line added while the backend was http://localhost:4000,
    // then reopened after it moved. Reduce it to its root-relative path so it
    // flows through the same rewrite. Non-backend absolutes (Shopify CDN,
    // kaicho.in) don't live under "/uploads/" and pass through untouched.
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Not a parseable URL — leave it as-is.
    }
    return url;
  }
  return url.startsWith("/") ? url : `/${url}`;
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
