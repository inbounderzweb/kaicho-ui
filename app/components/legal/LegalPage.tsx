import PageBanner from "../ui/PageBanner";
import Container from "../ui/Container";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export default function LegalPage({
  title,
  description,
  breadcrumbLabel,
  breadcrumbHref,
  intro,
  lastUpdated,
  sections,
  numbered = false,
}: {
  title: string;
  description: string;
  breadcrumbLabel: string;
  breadcrumbHref: string;
  intro?: string;
  lastUpdated?: string;
  sections: LegalSection[];
  numbered?: boolean;
}) {
  return (
    <>
      <PageBanner
        title={title}
        description={description}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: breadcrumbLabel, href: breadcrumbHref }]}
      />

      <section className="py-14 sm:py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            {lastUpdated && (
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Last updated: {lastUpdated}
              </p>
            )}
            {intro && (
              <p
                className={`text-sm leading-relaxed text-ink-muted sm:text-base ${
                  lastUpdated ? "mt-3" : ""
                }`}
              >
                {intro}
              </p>
            )}

            <ol className="mt-10 space-y-8">
              {sections.map((section, i) => (
                <li key={section.heading}>
                  <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                    {numbered ? `${i + 1}. ` : ""}
                    {section.heading}
                  </h2>
                  {section.paragraphs?.map((paragraph, pi) => (
                    <p
                      key={pi}
                      className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-3 space-y-1.5">
                      {section.bullets.map((bullet, bi) => (
                        <li
                          key={bi}
                          className="flex gap-2.5 text-sm leading-relaxed text-ink-muted sm:text-base"
                        >
                          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>
    </>
  );
}
