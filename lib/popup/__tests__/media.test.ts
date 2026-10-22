import { describe, expect, it } from "vitest";
import { popupImageUrl } from "../media";

const original = { heading: "", body: "", imageUrl: "/original-mobile.jpg" };

describe("device banner selection", () => {
  it("keeps the original mobile artwork when adding a desktop banner", () => {
    const content = { ...original, desktopImageUrl: "/desktop-wide.jpg" };
    expect(popupImageUrl(content, "desktop")).toBe("/desktop-wide.jpg");
    expect(popupImageUrl(content, "mobile")).toBe("/original-mobile.jpg");
  });

  it("uses separate artwork on each device and restores the default when removed", () => {
    const content = { ...original, desktopImageUrl: "/desktop.jpg", mobileImageUrl: "/mobile-tall.jpg" };
    expect(popupImageUrl(content, "desktop")).toBe("/desktop.jpg");
    expect(popupImageUrl(content, "mobile")).toBe("/mobile-tall.jpg");
    expect(popupImageUrl({ ...content, desktopImageUrl: "" }, "desktop")).toBe(original.imageUrl);
  });

  it("never shows the other device's artwork when there is no shared image", () => {
    expect(popupImageUrl({ heading: "", body: "", desktopImageUrl: "/desktop.jpg" }, "mobile")).toBeUndefined();
    expect(popupImageUrl({ heading: "", body: "", mobileImageUrl: "/mobile.jpg" }, "desktop")).toBeUndefined();
  });
});
