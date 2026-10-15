import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, imageFileProblem, partitionImageFiles } from "../uploadRules";

const file = (name: string, size: number, type = "image/jpeg") =>
  new File([new Uint8Array(size)], name, { type });

describe("uploadRules", () => {
  it("accepts an image at exactly the 1.5 MB limit and rejects one byte over", () => {
    expect(imageFileProblem(file("ok.jpg", MAX_IMAGE_BYTES))).toBeNull();
    expect(imageFileProblem(file("big.jpg", MAX_IMAGE_BYTES + 1))).toMatch(/exceeds the 1\.5 MB limit/);
  });

  it("rejects unsupported types and empty files", () => {
    expect(imageFileProblem(file("a.gif", 100, "image/gif"))).toMatch(/Unsupported/);
    expect(imageFileProblem(file("e.jpg", 0))).toMatch(/empty/);
  });

  it("splits a bulk selection into valid files and per-file rejections", () => {
    const { valid, rejected } = partitionImageFiles([
      file("a.jpg", 1000),
      file("huge.png", MAX_IMAGE_BYTES * 2, "image/png"),
      file("b.webp", 2000, "image/webp"),
      file("doc.pdf", 100, "application/pdf"),
    ]);
    expect(valid.map((f) => f.name)).toEqual(["a.jpg", "b.webp"]);
    expect(rejected.map((r) => r.name)).toEqual(["huge.png", "doc.pdf"]);
    expect(rejected[0].reason).toMatch(/MB/);
  });
});
