# TypeScript

TypeScript is pinned to 6.0 (`~6.0.3`) until `typescript-eslint` supports 7. Settings live in `tsconfig.base.json` (packages) and each app's `tsconfig.json`; strictness is never relaxed per file.

## Rules

- `strict`, `noUncheckedIndexedAccess` everywhere; packages also `exactOptionalPropertyTypes`.
- No `any`. Use `unknown` and narrow. A cast (`as`) needs a one-line reason, and never to silence an error.
- No non-null assertion (`!`) outside tests.
- `import type` for types (`verbatimModuleSyntax`).
- No `enum`; use string literal unions or `as const` objects.
- Model states as discriminated unions (`{ status: "loading" } | { status: "error"; error: ApiError } | …`), and end `switch` statements with an exhaustive `never` check.
- API types come only from `@keoshaa/api-client` (`components["schemas"][…]`, `paths[…]`). Never re-declare a backend shape by hand.
- Validate untrusted data at the boundary with zod: form input, URL and deep-link params, storage reads, anything parsed from JSON that is not the generated client.
- Small, typed functions; names say what, not how. Files under ~250 lines; split at 400.
- No barrel files except a feature's or package's public `index.ts`.
- Comments explain why, never narrate what the code does.
