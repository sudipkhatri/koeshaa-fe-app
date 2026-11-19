# Architecture

Principles: SOLID, DRY, KISS, YAGNI. Feature folders, high cohesion, low coupling. No premature abstraction, no shared "utils" dumping ground.

## Repository

| Path                  | Owns                                                                               | Must not                                               |
| --------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `apps/web`            | Next.js: public pages, teacher portal, admin, parent web                           | Import `apps/mobile`; hold user tokens on the server   |
| `apps/mobile`         | Expo: student and parent apps (Android first)                                      | Import `apps/web`; edit generated `ios/` or `android/` |
| `packages/api-client` | Generated API types + typed client                                                 | Hand-written endpoint types; React                     |
| `packages/core`       | Platform-free logic: envelope, errors, validation, identifiers, session interfaces | React, DOM, React Native, storage or network calls     |
| `packages/i18n`       | Nepali and English strings, `t()`                                                  | UI code                                                |
| `packages/tokens`     | Design tokens                                                                      | Platform-specific styling code                         |

Dependency direction: route/screen → feature → packages. Packages never import apps. A package that needs React (e.g. shared query hooks later) must work on both web and React Native or it does not belong in `packages/`.

**Share logic, not screens** ([ADR 0001](../../../../docs/adr/0001-monorepo-web-and-mobile.md)). Web and mobile UI are built separately with the same tokens and strings; no cross-platform UI kit.

## Inside an app

```
src/
  app/                 routes (Next.js App Router / Expo Router): thin, compose features
  features/<feature>/  components/, hooks/, api.ts (queries + mutations), schemas.ts, *.test.tsx
  components/          generic UI used by several features (Button, TextField, Screen)
  lib/                 app wiring: API client, session, env, providers
```

- Route files only compose: read params, render a feature component. No data fetching logic, no business rules.
- A feature owns its API hooks, components and tests. Another feature uses it through its public `index.ts`, never deep imports.
- Generic components in `components/` know nothing about features or the API.
- Each app keeps a small set of building blocks in `components/ui/` that every screen is made from: `Screen`, `Text`, `Button`, `Card`, `ListRow`, `Chip`, `TextField`, `Sheet` and `StateView` (loading, empty, error, no connection). This is the minimum set; add more when a pattern repeats. Screens use these instead of raw elements and styles. Each one is small, typed and styled only through token classes (`styling.md`).
- `lib/` is wiring only; no business rules.

## Abstractions

- Extract a shared component or hook after the second real use, not before.
- Move code to `packages/` only when both apps use it.
- Prefer composition (children, render props, hooks) over configuration-heavy components.
- Keep it plain: no generic base-component factories, no wrapper per third-party component "just in case", no state library beyond TanStack Query and the one session provider, no styling library beyond Tailwind/NativeWind.
- Do not add a feature the specs have not confirmed (`AGENTS.md`).
