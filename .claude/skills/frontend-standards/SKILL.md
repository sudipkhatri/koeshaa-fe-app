---
name: frontend-standards
description: Keoshaa frontend engineering standards for the web (Next.js) and mobile (Expo) apps and shared TypeScript packages (architecture, TypeScript, React, Next.js, Expo, data fetching, API client, forms, styling, accessibility, i18n, performance, offline, security, errors, testing, observability, documentation, review). Use before writing, changing, or reviewing any code in apps/ or packages/.
---

# Frontend standards

Guiding rule: prefer the simplest design that is **correct, accessible, secure, testable and fast on a cheap Android phone over a slow connection**. Do not apply patterns mechanically. `AGENTS.md` non-negotiables always win over anything here.

## Workflow

1. Classify the change and load only the references it touches:

   | Touching                                                      | Read                                                |
   | ------------------------------------------------------------- | --------------------------------------------------- |
   | New feature, folders, imports between apps and packages       | `references/architecture.md`                        |
   | Any TypeScript                                                | `references/typescript.md`                          |
   | Components, hooks, state                                      | `references/react.md`                               |
   | `apps/web` (routes, layouts, server/client components, proxy) | `references/nextjs.md`                              |
   | `apps/mobile` (screens, navigation, native modules, builds)   | `references/expo.md`                                |
   | Loading or changing server data                               | `references/data-fetching.md`                       |
   | API types, the generated client, backend changes              | `references/api-client.md`                          |
   | Forms, validation                                             | `references/forms.md`                               |
   | Layout, colours, spacing, themes                              | `references/styling.md`                             |
   | Any UI (always)                                               | `references/accessibility.md`, `references/i18n.md` |
   | Bundle size, rendering, lists, images, startup                | `references/performance.md`                         |
   | Storage on device, sync, no-connection behaviour              | `references/offline.md`                             |
   | Auth, tokens, storage, user input, deep links, secrets        | `references/security.md`                            |
   | Failure paths, error screens                                  | `references/errors.md`                              |
   | Any behaviour change (always)                                 | `references/testing.md`                             |
   | Logging, error reporting, analytics                           | `references/observability.md`                       |
   | Any behaviour, config, API or ops change (always)             | `references/documentation.md`                       |
   | Reviewing a diff (scored)                                     | `references/review.md`                              |

2. **Read the framework's own docs for the installed version before writing framework code.** Next.js ships its docs in `node_modules/next/dist/docs/` (see `apps/web/AGENTS.md`); Expo docs are versioned at `https://docs.expo.dev/versions/v<major>.0.0/` (see `apps/mobile/AGENTS.md`). Both change APIs between releases; never write from memory.
3. Plan first for new features, new screens with server data, or work over ~3 files (see `AGENTS.md`).
4. Implement in layers: shared types/schemas → API hooks → components → route/screen. Keep diffs small.
5. Write tests alongside the code (mandatory, `references/testing.md`).
6. Update docs and release notes (`references/documentation.md`).
7. Run `npm run verify`. Work is not done until it is green.
8. Review is manual: the developer runs `/review` (the `code-reviewer` agent, scored per `references/review.md`). Do not start it automatically.

## Current state of the codebase

Standards describe the target. Some supporting pieces do not exist yet; when a change needs one, build it as part of that change (with tests). Reviewers must not penalise its absence in changes that do not need it.

| Not yet built                                                                                               | Build it when                                 |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| TanStack Query provider and query-key helpers                                                               | First screen that loads server data           |
| Session handling (refresh single-flight, sign-out on `SESSION_ENDED`), mobile secure token store, device id | First sign-in screen                          |
| Form library (React Hook Form + zod resolver)                                                               | First form                                    |
| Locale switching (user choice, persisted)                                                                   | First settings screen                         |
| Mock API for tests (MSW)                                                                                    | First test of a component that calls the API  |
| Web end-to-end tests (Playwright)                                                                           | First complete web flow                       |
| Mobile end-to-end tests (Maestro)                                                                           | First complete mobile flow                    |
| On-device database and sync queue (`expo-sqlite`)                                                           | First offline feature (guest progress, ACC-6) |
| Error reporting (crash and error tracking)                                                                  | Before the first release to real users        |
| Push notifications                                                                                          | When the backend's push channel exists        |

Already in place:

- npm workspaces + Turborepo; `npm run verify` (format check, typecheck, lint, test, build)
- `apps/web`: Next.js 16 App Router, Tailwind v4 themed from tokens, Vitest + Testing Library
- `apps/mobile`: Expo SDK 57, Expo Router, Jest (`jest-expo`) + React Native Testing Library
- `packages/api-client`: types generated from the backend's OpenAPI (`openapi.json` snapshot) + typed client (`openapi-fetch`) that adds the token and turns error envelopes into `ApiError` / connection failures into `NetworkError`
- `packages/core`: envelope types, `ApiError`, identifier detection and phone normalisation (mirrors the backend), zod schemas for password, identifier and code, session interfaces
- `packages/i18n`: English (default) and Nepali catalogues with type-checked keys
- `packages/tokens`: colours, spacing, radii, type sizes, touch target
- Husky pre-commit (lint-staged, typecheck, test); CI workflow (`.github/workflows/ci.yml`)

## Core rules (always apply)

- Apps depend on packages; packages never import apps; the two apps never import each other. Share logic, not screens.
- Full TypeScript strictness; no `any`; API types only from `@keoshaa/api-client`.
- The backend decides permissions and validity; the UI may hide what a user cannot do but never relies on that for security.
- Tokens: web access token in memory only, refresh in the backend's `HttpOnly` cookie; mobile refresh token in secure storage only. Never `localStorage`/`AsyncStorage` for secrets.
- Every user-visible string comes from `@keoshaa/i18n`; every colour, space and size from `@keoshaa/tokens`.
- Every screen handles loading, empty, error and no-connection states.
- Switch on error `code`, never on message text.
- Every behaviour change and every bug fix ships with tests.

## Definition of done

- [ ] Layers and import boundaries respected
- [ ] Types complete; no `any`, no unchecked casts; inputs validated with zod
- [ ] Loading, empty, error and offline states handled; nothing double-submits
- [ ] Accessible (roles, labels, focus, contrast, touch targets); strings from i18n in Nepali and English
- [ ] No secrets in the client; tokens stored per `security.md`
- [ ] Tests per `testing.md`; regression test for bug fixes
- [ ] Performance budget respected for the touched route or screen (`performance.md`), numbers in the report
- [ ] Docs and an **Unreleased** entry in `docs/release-notes.md`; ADR for any new architectural decision
- [ ] `npm run verify` green
- [ ] Handed to the developer for review (merge bar: verdict Approve per `references/review.md`)

## Changing these standards

This skill is deliberately a fixed set of files. Do not add new reference files, skills or agents as part of a task. When a new convention is agreed, add it to the existing reference that covers the area. Propose a new reference file only when no existing one fits, and get the developer's approval first.
