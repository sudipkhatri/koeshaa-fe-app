// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", ".expo/*"] },
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
