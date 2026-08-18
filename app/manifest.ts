import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo/metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Kaicho",
    description:
      "Diabetic-friendly, gut-healthy, ready-to-eat porridges made with Japanese retort technology. No preservatives, 100% natural.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#00A861",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
