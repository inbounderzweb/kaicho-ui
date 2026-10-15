import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it("connects admin notifications to the API server when media uses another origin", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com/api");
  vi.stubEnv("NEXT_PUBLIC_MEDIA_BASE_URL", "https://cdn.example.com");
  const { BACKEND_ORIGIN } = await import("../client");
  expect(BACKEND_ORIGIN).toBe("https://api.example.com");
});
