import { describe, expect, it } from "vitest";
import { popupImageUrl } from "../media";

const original = { heading: "", body: "", imageUrl: "/original-mobile.jpg" };

describe("device banner selection", () => {
  it("uses the shared image only while no device-specific image exists", () => {
    expect(popupImageUrl(original, "desktop")).toBe("/original-mobile.jpg");
    expect(popupImageUrl(original, "mobile")).toBe("/original-mobile.jpg");
  });

  it("never falls back to the shared image once a device image is set", () => {
    const content = { ...original, desktopImageUrl: "/desktop-wide.jpg" };
    expect(popupImageUrl(content, "desktop")).toBe("/desktop-wide.jpg");
    expect(popupImageUrl(content, "mobile")).toBeUndefined();
  });

  it("uses separate artwork on each device, and a removed one shows no banner", () => {
    const content = { ...original, desktopImageUrl: "/desktop.jpg", mobileImageUrl: "/mobile-tall.jpg" };
    expect(popupImageUrl(content, "desktop")).toBe("/desktop.jpg");
    expect(popupImageUrl(content, "mobile")).toBe("/mobile-tall.jpg");
    expect(popupImageUrl({ ...content, mobileImageUrl: "" }, "mobile")).toBeUndefined();
  });

  it("never shows the other device's artwork when there is no shared image", () => {
    expect(popupImageUrl({ heading: "", body: "", desktopImageUrl: "/desktop.jpg" }, "mobile")).toBeUndefined();
    expect(popupImageUrl({ heading: "", body: "", mobileImageUrl: "/mobile.jpg" }, "desktop")).toBeUndefined();
  });
});
