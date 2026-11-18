"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminPageContent, useSavePageContent } from "@/lib/hooks/admin/useSeoContent";
import { ApiError } from "@/lib/api/ApiError";
import type { AdminPageContent, PageKey, SavePageContentPayload } from "@/lib/api/seoContent";
import { isEntityKey } from "@/lib/seo/seoPageRoutes";
import BlogImagePicker, { type PickedBlogImage } from "../BlogImagePicker";
import ConfirmDialog from "../ConfirmDialog";

const inputClass =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50";
const card =
  "space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark";
const btnPrimary =
  "rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-admin-border px-2.5 py-1 text-xs font-semibold hover:bg-black/5 disabled:opacity-30 dark:border-admin-border-dark dark:hover:bg-white/5";

const TITLES: Record<PageKey, string> = {
  HOME: "Home Page",
  ABOUT: "About Us",
  CONTACT: "Contact Us",
  ALL_PRODUCTS: "All Products",
  B2B: "B2B / Bulk Orders",
  PRODUCT: "Product Details",
  CATEGORY: "Category",
};

function Count({ value, limit }: { value: string; limit: number }) {
  return (
    <span className={`text-[11px] font-semibold tabular-nums ${value.length > limit ? "text-red-600" : "text-black/40 dark:text-white/40"}`}>
      {value.length}/{limit}
    </span>
  );
}

type FaqRow = { key: string; question: string; answer: string };
type Tab = "seo" | "html" | "faq";

let rowSeq = 0;
const newKey = () => `r${++rowSeq}`;

export default function SeoPageEditor({ pageType, entityId }: { pageType: PageKey; entityId: string | null }) {
  const { data, isLoading, isError, error, refetch } = useAdminPageContent(pageType, entityId);
  // Lives here, not in the form: the form remounts after each save.
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const backHref = isEntityKey(pageType) ? `/admin/seo/${pageType.toLowerCase()}` : "/admin/seo";
  return (
    <div className="space-y-5">
      <div>
        <Link href={backHref} className="text-xs text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white">
          ← {isEntityKey(pageType) ? TITLES[pageType] : "SEO Management"}
        </Link>
        <h1 className="mt-1 font-display text-xl font-bold">{TITLES[pageType]}</h1>
      </div>
      {isLoading && <p className="text-sm text-black/50 dark:text-white/50">Loading…</p>}
      {isError && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error instanceof ApiError && error.status === 404 ? "Not found." : "Could not load this page."}{" "}
          <button type="button" className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}
      {/* key: a save (new updatedAt) remounts the form from the sanitized server copy */}
      {data && <EditorForm key={data.content.updatedAt ?? "new"} pageType={pageType} entityId={entityId} initial={data.content} message={message} setMessage={setMessage} />}
    </div>
  );
}

type Message = { kind: "ok" | "err"; text: string } | null;

function EditorForm({
  pageType,
  entityId,
  initial,
  message,
  setMessage,
}: {
  pageType: PageKey;
  entityId: string | null;
  initial: AdminPageContent;
  message: Message;
  setMessage: (m: Message) => void;
}) {
  const save = useSavePageContent(pageType, entityId);
  const [tab, setTab] = useState<Tab>("seo");

  const [seo, setSeo] = useState(initial.seo);
  const [keywordsText, setKeywordsText] = useState(initial.seo.keywords.join(", "));
  const [ogImage, setOgImage] = useState<PickedBlogImage | null>(
    initial.seo.ogImageMediaId && initial.seo.ogImageUrl
      ? { mediaId: initial.seo.ogImageMediaId, url: initial.seo.ogImageUrl, altText: "" }
      : null
  );
  const [html, setHtml] = useState(initial.htmlContent);
  const [faqEnabled, setFaqEnabled] = useState(initial.faqEnabled);
  const [faqs, setFaqs] = useState<FaqRow[]>(initial.faqs.map((f) => ({ key: newKey(), question: f.question, answer: f.answer })));
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  const patchSeo = (p: Partial<typeof seo>) => setSeo((s) => ({ ...s, ...p }));
  const move = (i: number, d: -1 | 1) =>
    setFaqs((rows) => {
      const j = i + d;
      if (j < 0 || j >= rows.length) return rows;
      const next = [...rows];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const patchFaq = (i: number, p: Partial<FaqRow>) => setFaqs((rows) => rows.map((r, k) => (k === i ? { ...r, ...p } : r)));

  const onSave = () => {
    setMessage(null);
    const keywords = keywordsText.split(",").map((k) => k.trim()).filter(Boolean);
    const payload: SavePageContentPayload = {
      seo: {
        title: seo.title,
        description: seo.description,
        keywords,
        canonicalUrl: seo.canonicalUrl,
        ogTitle: seo.ogTitle,
        ogDescription: seo.ogDescription,
        ogImageMediaId: ogImage?.mediaId ?? null,
        robotsIndex: seo.robotsIndex,
        robotsFollow: seo.robotsFollow,
      },
      htmlContent: html,
      faqEnabled,
      // Fully blank rows (an "Add FAQ" never filled in) are ignored; a row with
      // only a question or only an answer still reaches the server and is rejected.
      faqs: faqs
        .filter((f) => f.question.trim() !== "" || f.answer.trim() !== "")
        .map((f) => ({ question: f.question, answer: f.answer })),
    };
    save.mutate(payload, {
      onSuccess: () => setMessage({ kind: "ok", text: "Saved." }),
      onError: (e) => setMessage({ kind: "err", text: e instanceof ApiError ? e.message : "Save failed. Please try again." }),
    });
  };

  const isProduct = pageType === "PRODUCT";
  const tabs: { id: Tab; label: string }[] = [
    { id: "seo", label: "SEO Settings" },
    { id: "html", label: "HTML Content" },
    { id: "faq", label: `FAQ${faqEnabled ? ` (${faqs.length})` : ""}` },
  ];

  return (
    <>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-admin-border dark:border-admin-border-dark">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${
              tab === t.id ? "border-admin-primary-dark text-black dark:border-admin-primary dark:text-white" : "border-transparent text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "seo" && (
        <div className={card}>
          <p className="text-[11px] text-black/45 dark:text-white/45">
            {isProduct
              ? "Product SEO is stored on the product itself — it matches what the product form shows. "
              : "Leave a field blank to keep this page's built-in default. "}
            Lengths are guidance; Google may still rewrite titles and descriptions.
          </p>
          <div>
            <div className="flex justify-between"><label className={labelClass} htmlFor="seo-title">SEO title</label><Count value={seo.title} limit={70} /></div>
            <input id="seo-title" className={inputClass} maxLength={70} value={seo.title} onChange={(e) => patchSeo({ title: e.target.value })} />
          </div>
          <div>
            <div className="flex justify-between"><label className={labelClass} htmlFor="seo-desc">SEO description</label><Count value={seo.description} limit={200} /></div>
            <textarea id="seo-desc" rows={3} className={inputClass} maxLength={200} value={seo.description} onChange={(e) => patchSeo({ description: e.target.value })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="seo-kw">SEO keywords (comma-separated, max 20)</label>
            <input id="seo-kw" className={inputClass} value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="seo-canon">Canonical URL</label>
            <input id="seo-canon" className={inputClass} placeholder="Defaults to this page's own URL — e.g. /products or https://…" value={seo.canonicalUrl} onChange={(e) => patchSeo({ canonicalUrl: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex justify-between"><label className={labelClass} htmlFor="og-title">Open Graph title</label><Count value={seo.ogTitle} limit={70} /></div>
              <input id="og-title" className={inputClass} maxLength={70} value={seo.ogTitle} onChange={(e) => patchSeo({ ogTitle: e.target.value })} />
            </div>
            <div>
              <div className="flex justify-between"><label className={labelClass} htmlFor="og-desc">Open Graph description</label><Count value={seo.ogDescription} limit={200} /></div>
              <input id="og-desc" className={inputClass} maxLength={200} value={seo.ogDescription} onChange={(e) => patchSeo({ ogDescription: e.target.value })} />
            </div>
          </div>
          <BlogImagePicker label="Open Graph image" recommended="1200×630" value={ogImage} onChange={setOgImage} />
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className={labelClass}>Robots meta</legend>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-admin-border px-3 py-2 text-sm dark:border-admin-border-dark">
              <span>{seo.robotsIndex ? "index" : "noindex"} <span className="text-xs text-black/45 dark:text-white/45">(show in search)</span></span>
              <input type="checkbox" checked={seo.robotsIndex} onChange={(e) => patchSeo({ robotsIndex: e.target.checked })} className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-admin-border px-3 py-2 text-sm dark:border-admin-border-dark">
              <span>{seo.robotsFollow ? "follow" : "nofollow"} <span className="text-xs text-black/45 dark:text-white/45">(follow links)</span></span>
              <input type="checkbox" checked={seo.robotsFollow} onChange={(e) => patchSeo({ robotsFollow: e.target.checked })} className="h-4 w-4" />
            </label>
          </fieldset>
        </div>
      )}

      {tab === "html" && (
        <div className={card}>
          <p className="text-[11px] text-black/45 dark:text-white/45">
            Allowed: headings (h2–h4; h1 becomes h2), paragraphs, lists, links, bold/italic, quotes, code and tables. Scripts,
            styles, iframes, forms, images, inline event handlers and javascript: links are removed when you save.
          </p>
          <div className="flex justify-between"><label className={labelClass} htmlFor="html-src">HTML source</label><Count value={html} limit={50000} /></div>
          <textarea
            id="html-src"
            rows={16}
            spellCheck={false}
            className={`${inputClass} font-mono text-[13px]`}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder={"<h2>Heading</h2>\n<p>Paragraph with a <a href=\"/about\">link</a>.</p>"}
          />
          {initial.htmlContent && (
            <div>
              <p className={labelClass}>Saved content (as visitors see it)</p>
              {/* Server-sanitized copy only — never the unsaved textarea. */}
              <div className="blog-prose max-h-80 overflow-auto rounded-xl border border-admin-border p-4 dark:border-admin-border-dark" dangerouslySetInnerHTML={{ __html: initial.htmlContent }} />
            </div>
          )}
        </div>
      )}

      {tab === "faq" && (
        <div className={card}>
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">Enable FAQ on this page</span>
            <input type="checkbox" role="switch" checked={faqEnabled} onChange={(e) => setFaqEnabled(e.target.checked)} className="h-5 w-5" />
          </label>
          {!faqEnabled && <p className="text-xs text-black/45 dark:text-white/45">FAQs are hidden on the storefront while this is off. Your entries are kept.</p>}
          {faqEnabled && (
            <div className="space-y-3">
              {faqs.length === 0 && <p className="text-sm text-black/50 dark:text-white/50">No FAQs yet.</p>}
              {faqs.map((f, i) => (
                <div key={f.key} className="space-y-2 rounded-xl border border-admin-border p-3 dark:border-admin-border-dark">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-black/50 dark:text-white/50">#{i + 1}</span>
                    <div className="flex gap-1.5">
                      <button type="button" className={btnGhost} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move FAQ ${i + 1} up`}>↑</button>
                      <button type="button" className={btnGhost} disabled={i === faqs.length - 1} onClick={() => move(i, 1)} aria-label={`Move FAQ ${i + 1} down`}>↓</button>
                      <button type="button" className={`${btnGhost} text-red-600`} onClick={() => setDeleteIdx(i)}>Delete</button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between"><label className={labelClass}>Question</label><Count value={f.question} limit={300} /></div>
                    <input className={inputClass} maxLength={300} value={f.question} onChange={(e) => patchFaq(i, { question: e.target.value })} />
                  </div>
                  <div>
                    <div className="flex justify-between"><label className={labelClass}>Answer (basic HTML allowed)</label><Count value={f.answer} limit={5000} /></div>
                    <textarea rows={4} className={inputClass} maxLength={5000} value={f.answer} onChange={(e) => patchFaq(i, { answer: e.target.value })} />
                  </div>
                </div>
              ))}
              <button
                type="button"
                disabled={faqs.length >= 50}
                className="rounded-full border border-admin-border px-4 py-2 text-sm font-semibold hover:bg-black/5 disabled:opacity-50 dark:border-admin-border-dark dark:hover:bg-white/5"
                onClick={() => setFaqs((r) => [...r, { key: newKey(), question: "", answer: "" }])}
              >
                + Add FAQ
              </button>
              <p className="text-[11px] text-black/45 dark:text-white/45">
                Completely blank entries are ignored on save; every other entry needs both a question and an answer. FAQ structured data (FAQPage) mirrors what is shown; Google
                limits FAQ rich results to certain sites, so it may not appear in search.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 bg-admin-bg/90 px-1 py-3 backdrop-blur dark:bg-admin-bg-dark/90">
        <button type="button" onClick={onSave} disabled={save.isPending} className={btnPrimary}>
          {save.isPending ? "Saving…" : "Save changes"}
        </button>
        {message && (
          <span role="status" className={`text-sm ${message.kind === "ok" ? "text-admin-primary-dark dark:text-admin-primary" : "text-red-600 dark:text-red-400"}`}>
            {message.text}
          </span>
        )}
      </div>

      <ConfirmDialog
        open={deleteIdx !== null}
        title="Delete this FAQ?"
        description="It is removed when you save changes."
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteIdx !== null) setFaqs((r) => r.filter((_, k) => k !== deleteIdx));
          setDeleteIdx(null);
        }}
        onCancel={() => setDeleteIdx(null)}
      />
    </>
  );
}
