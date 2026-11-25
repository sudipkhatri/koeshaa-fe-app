/** Builds the generated theme files from the tokens. Pure; `scripts/generate.ts` writes them. */
import { color, fontFamily, fontSize, minTouchTarget, radius, shadow, size } from "./index.ts";
import type { ColorScheme, Palette } from "./index.ts";

const HEADER = "Generated from @keoshaa/tokens by `npm run tokens:generate`. Do not edit.";

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** `{ primary, subject: { science } }` becomes `[["primary", v], ["subject-science", v]]`. */
function flatten(palette: Palette): [string, string][] {
  const out: [string, string][] = [];
  for (const [name, value] of Object.entries(palette)) {
    if (typeof value === "string") out.push([kebab(name), value]);
    else
      for (const [sub, hex] of Object.entries(value))
        out.push([`${kebab(name)}-${kebab(sub)}`, hex]);
  }
  return out;
}

const vars = (scheme: ColorScheme, prefix: string, indent: string) =>
  flatten(color[scheme])
    .map(([name, value]) => `${indent}--${prefix}-${name}: ${value};`)
    .join("\n");

/** Web: Tailwind v4 `@theme` (light) plus a dark override on the same variables. */
export function buildWebTheme(): string {
  const text = Object.entries(fontSize)
    .map(([name, px]) => `  --text-${name}: ${px}px;`)
    .join("\n");
  const shared =
    `  --radius-card: ${radius.card}px;\n  --radius-sheet: ${radius.sheet}px;\n` +
    `  --radius-square: ${radius.square}px;\n${text}\n` +
    `  --shadow-card: ${shadow.light};`;
  return [
    `/* ${HEADER} */`,
    `@theme {\n${vars("light", "color", "  ")}\n${shared}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root {\n${vars("dark", "color", "    ")}\n    --shadow-card: ${shadow.dark};\n  }\n}`,
    "",
  ].join("\n\n");
}

/** Mobile: Tailwind 3 directives and the CSS variables NativeWind switches with the colour scheme. */
export function buildMobileCss(): string {
  return [
    `/* ${HEADER} */`,
    "@tailwind base;\n@tailwind components;\n@tailwind utilities;",
    `:root {\n${vars("light", "color", "  ")}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root {\n${vars("dark", "color", "    ")}\n  }\n}`,
    "",
  ].join("\n\n");
}

const sizeExtend = Object.fromEntries(Object.entries(size).map(([name, px]) => [name, `${px}px`]));

/** Mobile: the Tailwind 3 `theme` object (CommonJS) that references those variables. */
export function buildMobileTailwindTheme(): string {
  const colors: Record<string, string> = { transparent: "transparent" };
  for (const [name] of flatten(color.light)) colors[name] = `var(--color-${name})`;
  const theme = {
    colors,
    borderRadius: Object.fromEntries(Object.entries(radius).map(([name, px]) => [name, `${px}px`])),
    fontSize: Object.fromEntries(Object.entries(fontSize).map(([name, px]) => [name, `${px}px`])),
    fontFamily: {
      ui: [fontFamily.regular],
      "ui-medium": [fontFamily.medium],
      "ui-semibold": [fontFamily.semibold],
      "ui-bold": [fontFamily.bold],
    },
    extend: {
      minHeight: { touch: `${minTouchTarget}px`, ...sizeExtend },
      height: sizeExtend,
      width: sizeExtend,
      minWidth: { touch: `${minTouchTarget}px` },
    },
  };
  return `// ${HEADER}\nmodule.exports = ${JSON.stringify(theme, null, 2)};\n`;
}
