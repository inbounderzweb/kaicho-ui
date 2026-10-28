import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Regression: the +/− stepper on the product card stopped responding. The ADD
// button's tap-area helper (an absolutely positioned ::before layer, `before:`
// classes) had been merged into the class string shared with the stepper wrapper;
// on the wrapper that invisible layer paints above its buttons and swallows every
// tap. The repo has no DOM test environment, so guard the source-level cause.
const source = readFileSync(path.join(__dirname, "../ProductCard.tsx"), "utf8");

describe("ProductCard +/− stepper", () => {
  it("the class string shared by the stepper and the ADD button has no ::before overlay", () => {
    const shared = /const actionBase = "([^"]*)"/.exec(source)?.[1];
    expect(shared).toBeTruthy();
    expect(shared).not.toContain("before:");
  });

  it("the tap-area overlay is applied to the ADD button only", () => {
    const stepperWrapper = /className=\{`\$\{actionBase\}([^`]*)`\}\s*role="group"/.exec(source)?.[1] ?? "";
    expect(stepperWrapper).not.toContain("tapArea");
    expect(source).toMatch(/\$\{actionBase\} \$\{actionSize\} \$\{tapArea\}/);
  });
});
