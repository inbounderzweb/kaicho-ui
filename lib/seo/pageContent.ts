import { cache } from "react";
import { fetchPublicPageContent, type PageKey, type PublicPageContent } from "@/lib/api/seoContent";
import { resolveMediaUrl } from "@/lib/api/client";
import { buildPageMetadata } from "./metadata";

type Defaults = Parameters<typeof buildPageMetadata>[0];

/**
 * Admin-managed content for a page, or null when the backend is unreachable /
 * nothing exists. NEVER throws: SEO Management must not be able to take a
 * page down, so callers fall back to their built-in metadata and render no
 * extra sections. cache() de-dupes generateMetadata + the page body.
 */
export const getPageContent = cache(
  async (pageType: PageKey, slug?: string): Promise<PublicPageContent | null> => {
    try {
      return await fetchPublicPageContent(pageType, slug, { revalidate: 60 });
    } catch {
      return null;
    }
  }
);

/**
 * Same as buildPageMetadata, but any non-blank admin SEO value overrides the
 * code-defined default for that page. Blank = keep the default, so existing
 * metadata is preserved until an admin deliberately changes it.
 * Single source of metadata per page → no duplicate tags.
 */
export async function buildManagedMetadata(
  pageType: PageKey,
  defaults: Defaults = {},
  slug?: string
) {
  const content = await getPageContent(pageType, slug);
  const seo = content?.seo;
  if (!seo) return buildPageMetadata(defaults);

  return buildPageMetadata({
    ...defaults,
    title: seo.title || defaults?.title,
    description: seo.description || defaults?.description,
    canonical: seo.canonicalUrl || defaults?.canonical,
    noIndex: seo.robotsIndex === false ? true : defaults?.noIndex,
    noFollow: seo.robotsFollow === false ? true : defaults?.noFollow,
    image: seo.ogImageUrl
      ? { url: resolveMediaUrl(seo.ogImageUrl), alt: seo.ogTitle || seo.title || defaults?.title }
      : defaults?.image,
    ogTitle: seo.ogTitle || undefined,
    ogDescription: seo.ogDescription || undefined,
    keywords: seo.keywords?.length ? seo.keywords : undefined,
  });
}
