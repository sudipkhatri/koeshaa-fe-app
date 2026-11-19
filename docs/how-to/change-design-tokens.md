# Change a design token

Every colour, radius, font size and shadow lives in `packages/tokens/src/index.ts` (light and dark for each colour).

1. Edit the value, or add the colour to both `light` and `dark`.
2. Regenerate the themes:

   ```bash
   npm run tokens:generate
   ```

3. Use the class (`bg-primary`, `text-on-primary-tint`, `rounded-card`). Never add a colour in an app's config first.
4. Check the screen in light, dark, English and Nepali. On mobile open the dev-only Kit screen (`/kit`).

`npm test` fails when a generated file (web `tokens.generated.css`, mobile `global.css` and `tailwind.theme.generated.js`) no longer matches the tokens. Why NativeWind 4: [ADR 0004](../adr/0004-nativewind-token-theme.md).

## Why `allowImportingTsExtensions` is on

`packages/tokens` is consumed as TypeScript source by Node scripts (`tokens:generate`, the drift tests), where relative imports need the `.ts` extension. The apps' `tsconfig.json` enable `allowImportingTsExtensions` only so they can type-check that source. App code must not use `.ts` specifiers: import without an extension (`@/lib/errors`, `./query`).
