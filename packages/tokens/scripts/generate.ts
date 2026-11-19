import { writeFileSync } from "node:fs";

import { buildMobileCss, buildMobileTailwindTheme, buildWebTheme } from "../src/theme.ts";
import type { GeneratedTarget } from "../src/index.ts";
import { generatedFiles } from "../src/files.ts";

const outputs: Record<GeneratedTarget, string> = {
  webTheme: buildWebTheme(),
  mobileCss: buildMobileCss(),
  mobileTailwindTheme: buildMobileTailwindTheme(),
};

for (const key of Object.keys(generatedFiles) as GeneratedTarget[]) {
  writeFileSync(generatedFiles[key], outputs[key]);
  console.log(`wrote ${generatedFiles[key].pathname}`);
}
