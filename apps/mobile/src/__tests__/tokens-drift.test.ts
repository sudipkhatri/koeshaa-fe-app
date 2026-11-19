import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildMobileCss, buildMobileTailwindTheme } from "@keoshaa/tokens/theme";

const root = join(__dirname, "..", "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");

describe("generated mobile theme", () => {
  it("global.css matches the tokens (run `npm run tokens:generate`)", () => {
    expect(read("global.css")).toBe(buildMobileCss());
  });

  it("tailwind.theme.generated.js matches the tokens", () => {
    expect(read("tailwind.theme.generated.js")).toBe(buildMobileTailwindTheme());
  });
});
