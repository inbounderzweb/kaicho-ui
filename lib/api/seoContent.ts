import { apiFetch, type PublicReadOptions } from "./client";

// Admin: /api/admin/seo/* (requireAuth + requireRole("admin")).
// Public: GET /api/page-content/:pageType[?slug=] — one unauthenticated read.

export const STATIC_PAGE_KEYS = ["HOME", "ABOUT", "CONTACT", "ALL_PRODUCTS", "B2B"] as const;
export type StaticPageKey = (typeof STATIC_PAGE_KEYS)[number];
export type EntityPageKey = "PRODUCT" | "CATEGORY";
export type PageKey = StaticPageKey | EntityPageKey;

export interface SeoFields {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageMediaId: string | null;
  ogImageUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface AdminPageContent {
  pageType: PageKey;
  entityId: string | null;
  seo: SeoFields;
  htmlContent: string;
  faqEnabled: boolean;
  faqs: FaqItem[];
  updatedAt: string | null;
}

export interface StaticPageSummary {
  pageType: StaticPageKey;
  label: string;
  path: string;
  hasSeo: boolean;
  hasHtml: boolean;
  faqEnabled: boolean;
  faqCount: number;
  updatedAt: string | null;
}

export interface EntityOption {
  id: string;
  name: string;
  slug: string;
  faqEnabled: boolean;
  faqCount: number;
  hasHtml: boolean;
}

export interface SavePageContentPayload {
  seo: {
    title: string;
    description: string;
    keywords: string[];
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImageMediaId?: string | null;
    robotsIndex: boolean;
    robotsFollow: boolean;
  };
  htmlContent: string;
  faqEnabled: boolean;
  /** Array order is the display order. */
  faqs: { question: string; answer: string }[];
}

export const fetchSeoPages = () =>
  apiFetch<{ pages: StaticPageSummary[] }>("/admin/seo/pages", { method: "GET" });

export const fetchSeoEntities = (pageType: EntityPageKey, search?: string) =>
  apiFetch<{ items: EntityOption[] }>(
    `/admin/seo/entities/${pageType}${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    { method: "GET" }
  );

function target(pageType: PageKey, entityId?: string | null) {
  return entityId
    ? `/admin/seo/entities/${pageType}/${encodeURIComponent(entityId)}`
    : `/admin/seo/pages/${pageType}`;
}

export const fetchAdminPageContent = (pageType: PageKey, entityId?: string | null) =>
  apiFetch<{ content: AdminPageContent }>(target(pageType, entityId), { method: "GET" });

export const saveAdminPageContent = (
  pageType: PageKey,
  entityId: string | null | undefined,
  payload: SavePageContentPayload
) =>
  apiFetch<{ content: AdminPageContent }>(target(pageType, entityId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// ---- Public ----

export interface PublicPageContent {
  seo: SeoFields;
  htmlContent: string;
  faq: { enabled: boolean; items: FaqItem[] };
}

export function fetchPublicPageContent(
  pageType: PageKey,
  slug?: string,
  opts?: PublicReadOptions
): Promise<PublicPageContent> {
  return apiFetch<PublicPageContent>(
    `/page-content/${pageType}${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`,
    { method: "GET", ...opts }
  );
}
