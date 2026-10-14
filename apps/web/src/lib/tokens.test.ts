// @vitest-environment node
import { readFileSync } from "node:fs";

import { color } from "@keoshaa/tokens";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

describe("web theme", () => {
  it.each(Object.entries(color))("defines --color-%s from the shared tokens", (name, value) => {
    expect(css.toLowerCase()).toContain(`--color-${kebab(name)}: ${value.toLowerCase()};`);
  });
});
