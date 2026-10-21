import { describe, it, expect } from "vitest";
import { countdownParts } from "../countdown";

const now = Date.parse("2026-01-01T00:00:00Z");

describe("countdownParts", () => {
  it("splits into d/h/m/s", () => {
    const p = countdownParts("2026-01-03T04:05:06Z", now)!;
    expect([p.days, p.hours, p.minutes, p.seconds]).toEqual([2, 4, 5, 6]);
    expect(p.urgent).toBe(false);
  });
  it("is urgent under one hour", () => {
    expect(countdownParts("2026-01-01T00:59:59Z", now)!.urgent).toBe(true);
    expect(countdownParts("2026-01-01T01:00:01Z", now)!.urgent).toBe(false);
  });
  it("returns null when over, empty or invalid", () => {
    expect(countdownParts("2025-12-31T23:59:59Z", now)).toBeNull();
    expect(countdownParts("2026-01-01T00:00:00Z", now)).toBeNull();
    expect(countdownParts(null, now)).toBeNull();
    expect(countdownParts("nope", now)).toBeNull();
  });
});
