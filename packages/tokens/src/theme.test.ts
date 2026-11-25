// @vitest-environment node
import { describe, expect, it } from "vitest";

import { color, minTouchTarget, space } from "./index.ts";
import { buildMobileCss, buildWebTheme } from "./theme.ts";

describe("theme builders", () => {
  it("defines every colour for light and dark", () => {
    expect(Object.keys(color.dark)).toEqual(Object.keys(color.light));
    expect(buildMobileCss()).toContain("--color-primary: #056B67;");
    expect(buildMobileCss()).toContain("--color-primary: #0A7A74;");
    expect(buildWebTheme()).toContain("--color-subject-science: #047857;");
  });
});

describe("scales", () => {
  it("keeps spacing on the 4-point grid", () => {
    for (const step of space) expect(step % 4).toBe(0);
  });

  it("keeps the touch target at 48", () => {
    expect(minTouchTarget).toBe(48);
  });
});
