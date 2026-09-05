import type { NextConfig } from "next";

// Product/category/brand media is served from the backend's own origin
// (see lib/api/client.ts's resolveMediaUrl — root-relative "/uploads/..."
// URLs resolved against NEXT_PUBLIC_API_BASE_URL with the "/api" suffix
// stripped). next/image refuses to optimize an unlisted remote host, so
// that origin needs its own remotePattern entry — computed from the same
// env var the API client uses, defaulting to the local dev backend,
// rather than hardcoding a domain that would break in every other
// environment.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const apiOrigin = new URL(apiBaseUrl);

// Where backend media (/uploads/media/...) is fetched from — see
// lib/api/client.ts's resolveMediaUrl. Its own env var so it can differ
// from the API origin (e.g. localhost:4000 for media while the API goes
// through a dev tunnel). next/image only optimizes hosts listed in
// remotePatterns, so this origin needs its own entry, computed from the
// same env var the client uses. Falls back to the API origin when unset.
const mediaOrigin = new URL(
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
    apiBaseUrl.replace(/\/api\/?$/, "")
);

// True only when the backend origin IS a loopback address (the local dev
// setup, where NEXT_PUBLIC_API_BASE_URL points at http://localhost:4000).
// next/image's optimizer resolves the remote host and, as an SSRF
// safeguard, refuses to fetch anything that resolves to a private/loopback
// IP unless dangerouslyAllowLocalIP is set — which is exactly why product
// images 404'd through the optimizer in local dev ("hostname resolved to
// private IP" error). Gating on the hostname itself (rather than e.g.
// NODE_ENV) means this stays off automatically in any real deployment,
// where the API origin is a real domain, not localhost/127.0.0.1/::1.
const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "::1"];
const isLoopbackApiHost =
  LOOPBACK_HOSTS.includes(apiOrigin.hostname) ||
  LOOPBACK_HOSTS.includes(mediaOrigin.hostname);

// Where "/api/*" and "/uploads/media/*" browser requests are proxied to.
// The browser (lib/api/client.ts) always calls the frontend's own origin so
// requests stay same-origin (no CORS, no mixed content, and — with the dev
// tunnel — the browser never hits the tunnel directly and can't be served
// its interstitial HTML instead of the API JSON). The Next server runs on
// the same host as the backend in local dev, so the default is the local
// backend; set BACKEND_PROXY_ORIGIN to point elsewhere.
const backendProxyOrigin = (process.env.BACKEND_PROXY_ORIGIN || "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/api/:path*", destination: `${backendProxyOrigin}/api/:path*` },
        { source: "/uploads/media/:path*", destination: `${backendProxyOrigin}/uploads/media/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    // Keep an optimised image in the on-disk cache for 24h instead of the
    // 60s default — product photos don't change, so re-optimising them on
    // every viewer is wasted CPU on the render server.
    minimumCacheTTL: 60 * 60 * 24,
    // Only emit the formats and widths the storefront actually uses — a
    // smaller matrix means fewer Sharp jobs and a smaller cache.
    formats: ["image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1200, 1600],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kaicho.in",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        // Media served straight from Cloudinary's CDN when
        // STORAGE_PROVIDER=cloudinary (see kaicho-be's CloudinaryStorageProvider.getUrl) —
        // same "non-backend absolute, pass through untouched" bucket as
        // Shopify/kaicho.in above, just missing its own entry until now.
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: apiOrigin.protocol === "https:" ? "https" : "http",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port || undefined,
      },
      {
        protocol: mediaOrigin.protocol === "https:" ? "https" : "http",
        hostname: mediaOrigin.hostname,
        port: mediaOrigin.port || undefined,
      },
    ],
    ...(isLoopbackApiHost ? { dangerouslyAllowLocalIP: true } : {}),
  },
  // Keep already-rendered route segments in the client router cache longer,
  // so back/forward and re-navigation don't re-hit the server.
  experimental: {
    staleTimes: { dynamic: 30, static: 300 },
  },
  // Conservative, universally-safe headers only. HSTS and a real
  // Content-Security-Policy are deliberately NOT set here: HSTS is a long-
  // lived, hard-to-undo browser directive that should be verified against
  // the actual production HTTPS/cert setup first (many hosts like Vercel
  // already add it at the edge), and a CSP tight enough to matter would
  // need to be built against the live set of GTM/analytics/WhatsApp/image
  // domains and tested — guessing one risks silently breaking the site.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
