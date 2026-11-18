import JsonLd from "./JsonLd";
import Container from "../ui/Container";
import { faqPageJsonLd } from "@/lib/seo/structured-data";
import type { PageKey, PublicPageContent } from "@/lib/api/seoContent";
import { getPageContent } from "@/lib/seo/pageContent";

/**
 * Admin-managed HTML + FAQ for one page (SEO Management). Server component:
 * the HTML was sanitized by the backend on save (see seoContent.sanitize.ts),
 * and renders with the same `blog-prose` styles as other admin-authored HTML.
 * Renders nothing when there is nothing configured, so pages are unchanged
 * until an admin adds content.
 */
export default async function ManagedPageSections({
  pageType,
  slug,
  content: provided,
}: {
  pageType: PageKey;
  slug?: string;
  content?: PublicPageContent | null;
}) {
  const content = provided === undefined ? await getPageContent(pageType, slug) : provided;
  if (!content) return null;

  const hasHtml = content.htmlContent.trim() !== "";
  const faqItems = content.faq.enabled ? content.faq.items : [];
  if (!hasHtml && faqItems.length === 0) return null;

  const faqLd = faqItems.length ? faqPageJsonLd(faqItems) : null;

  return (
    <>
      {hasHtml && (
        <section aria-label="Page content" className="py-10 sm:py-14">
          <Container>
            <div
              className="blog-prose mx-auto max-w-4xl break-words"
              dangerouslySetInnerHTML={{ __html: content.htmlContent }}
            />
          </Container>
        </section>
      )}
      {faqItems.length > 0 && (
        <section aria-labelledby={`faq-${pageType}`} className="py-10 sm:py-14">
          <Container>
            <div className="mx-auto max-w-3xl">
              <h2 id={`faq-${pageType}`} className="font-display text-2xl font-bold sm:text-3xl">
                Frequently asked questions
              </h2>
              <div className="mt-6 divide-y divide-black/10 rounded-2xl border border-black/10">
                {faqItems.map((item) => (
                  <details key={item.id} className="group px-4 py-1 sm:px-5">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left text-base font-semibold [&::-webkit-details-marker]:hidden">
                      <span>{item.question}</span>
                      <span
                        aria-hidden
                        className="shrink-0 text-xl leading-none transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div
                      className="blog-prose pb-4 text-sm sm:text-base"
                      dangerouslySetInnerHTML={{ __html: item.answer }}
                    />
                  </details>
                ))}
              </div>
            </div>
          </Container>
          {faqLd && <JsonLd data={faqLd} />}
        </section>
      )}
    </>
  );
}
