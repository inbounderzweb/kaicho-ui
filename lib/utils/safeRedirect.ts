// Validates a redirect target from an untrusted source (a query string
// param a user could craft into a link) before it's ever passed to
// router.replace()/router.push(). Only a same-origin internal path is safe:
// anything else is a potential open redirect used for phishing after a
// legitimate-looking login. Only "/", "/products", "/admin"-shaped values
// pass; "https://evil.example", "//evil.example", and "javascript:..." all
// fall back instead.
export function getSafeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;

  // Must be a single leading slash: rejects protocol-relative ("//host"),
  // absolute URLs ("https://..."), and bare scheme values ("javascript:...").
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }

  // Defense in depth: reject anything whose decoded form still smuggles a
  // URL scheme (e.g. "/%2F%2Fevil.example" or an encoded "javascript:").
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }

  if (decoded.startsWith("//") || decoded.startsWith("/\\")) {
    return fallback;
  }

  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) {
    return fallback;
  }

  return raw;
}
