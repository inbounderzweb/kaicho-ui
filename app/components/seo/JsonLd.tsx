/**
 * Renders a JSON-LD structured-data script tag. `data` is always
 * server-generated (see lib/seo/structured-data.ts). Some values (e.g. FAQ
 * text) originate from admin-authored content, so "<" is escaped to \u003c:
 * a "</script>" inside a string can then never close the tag early.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
