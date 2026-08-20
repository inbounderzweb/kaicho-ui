import { describe, it, expect } from "vitest";
import { getSafeRedirectPath } from "../safeRedirect";

describe("getSafeRedirectPath", () => {
  it.each([
    ["/", "/"],
    ["/products", "/products"],
    ["/account", "/account"],
    ["/checkout", "/checkout"],
    ["/admin", "/admin"],
  ])("allows internal path %s", (input, expected) => {
    expect(getSafeRedirectPath(input)).toBe(expected);
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "https://evil.example/path",
    "javascript:alert(1)",
    "javascript:alert(document.cookie)",
    "/\\evil.example",
    encodeURIComponent("//evil.example"),
  ])("rejects malicious/unsafe value %s and falls back to /", (input) => {
    expect(getSafeRedirectPath(input)).toBe("/");
  });

  it("rejects a URL-encoded protocol-relative value even after decoding", () => {
    expect(getSafeRedirectPath("/%2F%2Fevil.example")).toBe("/");
  });

  it("returns the given fallback, not always /, when provided", () => {
    expect(getSafeRedirectPath("https://evil.example", "/products")).toBe("/products");
  });

  it("returns the fallback for null/undefined/empty input", () => {
    expect(getSafeRedirectPath(null)).toBe("/");
    expect(getSafeRedirectPath(undefined)).toBe("/");
    expect(getSafeRedirectPath("")).toBe("/");
  });
});
