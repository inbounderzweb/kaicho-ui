/**
 * Renders a JSON-LD structured-data script tag. `data` is always
 * server-generated from static site content (see lib/seo/structured-data.ts)
 * — never raw user input — so injecting it directly is safe.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
