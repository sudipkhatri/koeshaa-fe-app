import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\b[a-z-]+-\\[[^\\]]+\\]/]",
          message: "No arbitrary Tailwind values in className; use a token (see styling.md).",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\b[a-z-]+-\\[[^\\]]+\\]/]",
          message: "No arbitrary Tailwind values in className; use a token (see styling.md).",
        },
      ],
    },
  },
]);

export default eslintConfig;
