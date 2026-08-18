import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kaicho.in",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
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
