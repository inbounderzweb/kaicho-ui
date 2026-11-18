import type { PageKey, StaticPageKey, EntityPageKey } from "@/lib/api/seoContent";

// URL segment <-> API page key. The admin URLs are lowercase/hyphenated.
const SEGMENTS: Record<string, PageKey> = {
  home: "HOME",
  about: "ABOUT",
  contact: "CONTACT",
  "all-products": "ALL_PRODUCTS",
  b2b: "B2B",
  product: "PRODUCT",
  category: "CATEGORY",
};

export function pageKeyFromSegment(segment: string): PageKey | null {
  return SEGMENTS[segment] ?? null;
}
export function segmentFromPageKey(key: PageKey): string {
  return key.toLowerCase().replace(/_/g, "-");
}
export const isEntityKey = (k: PageKey): k is EntityPageKey => k === "PRODUCT" || k === "CATEGORY";
export const isStaticKey = (k: PageKey): k is StaticPageKey => !isEntityKey(k);
