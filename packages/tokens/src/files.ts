import type { GeneratedTarget } from "./index.ts";

/** Where each generated file lives (used by the generator; each app tests its own file). */
export const generatedFiles: Record<GeneratedTarget, URL> = {
  webTheme: new URL("../../../apps/web/src/app/tokens.generated.css", import.meta.url),
  mobileCss: new URL("../../../apps/mobile/global.css", import.meta.url),
  mobileTailwindTheme: new URL("../../../apps/mobile/tailwind.theme.generated.js", import.meta.url),
};
