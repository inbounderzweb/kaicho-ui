import type { Metadata } from "next";
import { absoluteUrl } from "./urls";

export const SITE_NAME = "Kaicho Foods";
export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
export const DEFAULT_TITLE = "Kaicho Foods | Ready-to-Eat Healthy Meals";
export const DEFAULT_DESCRIPTION =
  "Diabetic-friendly, gut-healthy, ready-to-eat porridges made with Japanese retort technology. No preservatives, 100% natural, high in fiber & protein. Heat and eat in minutes.";

/** 1200x630 branded share image, used as the default OG/Twitter image for
 *  every page that doesn't supply its own. See public/og-image.png. */
export const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Kaicho Foods — Ready-to-Eat Nutritious Meals",
};

type PageMetadataInput = {
  /** Page-specific title. Omit to use the site default (and, on non-root
   *  routes, let the root layout's `title.template` apply automatically). */
  title?: string;
  description?: string;
  /** Site-relative path, e.g. "/blog". Defaults to the homepage. */
  path?: string;
  image?: { url: string; width?: number; height?: number; alt?: string };
  /** Set true for pages that shouldn't be indexed (thank-you pages, etc.) */
  noIndex?: boolean;
};

/**
 * Builds a Next.js `Metadata` object for a single route, filling in the
 * site-wide defaults (canonical, Open Graph, Twitter, robots) so each route
 * only has to specify what's actually different about it — this is the
 * shared source of truth instead of every route hand-writing the same
 * OG/Twitter/robots shape.
 */
export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetadataInput = {}): Metadata {
  const resolvedTitle = title ?? DEFAULT_TITLE;
  const canonical = absoluteUrl(path);
  const ogImage = {
    url: absoluteUrl(image.url),
    width: image.width,
    height: image.height,
    alt: image.alt ?? resolvedTitle,
  };

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [ogImage.url],
    },
  };
}
