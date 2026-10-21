import { describe, it, expect } from "vitest";
import { popupFormSchema } from "../popup.schema";
import { defaultPopupForm, formValuesToPayload } from "../../popup/form";

const valid = () => ({ ...defaultPopupForm(), name: "Welcome", content: { ...defaultPopupForm().content, heading: "Hi" } });
const issues = (v: unknown) => {
  const r = popupFormSchema.safeParse(v);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

describe("popupFormSchema", () => {
  it("accepts the defaults (3s delay, 10s auto-close)", () => {
    expect(issues(valid())).toEqual([]);
  });

  it("enforces numeric bounds", () => {
    const v = valid();
    v.timing.shared.initialDelaySeconds = 301;
    v.timing.shared.autoCloseAfterSeconds = 1;
    const out = issues(v).join("|");
    expect(out).toMatch(/shared.initialDelaySeconds/);
    expect(out).toMatch(/shared.autoCloseAfterSeconds/);
  });

  it("rejects NaN (empty number input)", () => {
    const v = valid();
    v.timing.desktop.initialDelaySeconds = NaN;
    expect(issues(v).some((i) => i.startsWith("timing.desktop.initialDelaySeconds"))).toBe(true);
  });

  it("auto-close may not exceed the max display time, per device set", () => {
    const v = valid();
    v.display.maxDisplaySeconds = 20;
    v.timing.mobile.autoCloseAfterSeconds = 30;
    expect(issues(v).some((i) => i.startsWith("timing.mobile.autoCloseAfterSeconds"))).toBe(true);
  });

  it("an auto-close value is ignored by the ceiling check when auto-close is off", () => {
    const v = valid();
    v.display.maxDisplaySeconds = 20;
    v.timing.mobile.autoCloseEnabled = false;
    v.timing.mobile.autoCloseAfterSeconds = 30;
    expect(issues(v)).toEqual([]);
  });

  it("no early dismissal → needs auto-close ≤ 10s on every set", () => {
    const v = valid();
    v.display.allowEarlyDismiss = false;
    expect(issues(v)).toEqual([]); // defaults are 10s
    v.timing.shared.autoCloseEnabled = false;
    expect(issues(v).some((i) => /Disabling early dismissal/.test(i))).toBe(true);
  });

  it("repeat interval must be ≥ minimum reappearance (0 = off)", () => {
    const v = valid();
    v.display.repeatIntervalSeconds = 10;
    expect(issues(v).some((i) => i.startsWith("display.repeatIntervalSeconds"))).toBe(true);
    v.display.repeatIntervalSeconds = 0;
    expect(issues(v)).toEqual([]);
  });

  it("CTA needs label and link, links must be safe", () => {
    const v = valid();
    v.content.ctaLabel = "Shop";
    expect(issues(v).some((i) => i.startsWith("content.ctaUrl"))).toBe(true);
    v.content.ctaUrl = "javascript:alert(1)";
    expect(issues(v).some((i) => /https/.test(i))).toBe(true);
    v.content.ctaUrl = "/products";
    expect(issues(v)).toEqual([]);
  });

  it("schedule end must follow start", () => {
    const v = valid();
    v.schedule = { startsAt: "2030-01-02T00:00:00.000Z", endsAt: "2030-01-01T00:00:00.000Z" };
    expect(issues(v).some((i) => i.startsWith("schedule.endsAt"))).toBe(true);
  });

  it("payload drops empty optionals and null-ifies empty dates", () => {
    const p = formValuesToPayload(valid());
    expect(p.content.imageUrl).toBeUndefined();
    expect(p.content.ctaLabel).toBeUndefined();
    expect(p.schedule).toEqual({ startsAt: null, endsAt: null });
  });
});
