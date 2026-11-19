// @vitest-environment node
import { readFileSync } from "node:fs";

import { color } from "@keoshaa/tokens";
import { buildWebTheme } from "@keoshaa/tokens/theme";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./tokens.generated.css", import.meta.url), "utf8");

describe("web theme", () => {
  it("matches the tokens (run `npm run tokens:generate`)", () => {
    expect(css).toBe(buildWebTheme());
  });

  it("is imported by globals.css", () => {
    const globals = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
    expect(globals).toContain('@import "./tokens.generated.css";');
  });

  it("defines the dark colours under prefers-color-scheme (compiled by `next build`)", () => {
    const dark = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
    expect(dark).toContain(":root {");
    expect(dark).toContain(`--color-primary: ${color.dark.primary};`);
    expect(dark).toContain(`--color-background: ${color.dark.background};`);
    expect(dark).toContain(`--color-subject-science: ${color.dark.subject.science};`);
  });
});
