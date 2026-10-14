---
name: new-feature
description: Scaffold a new feature folder in apps/web or apps/mobile (route, components, API hooks, schemas, strings, tests). Use when adding a new screen or feature area.
---

# New feature

Follow the `frontend-standards` skill throughout (load `architecture.md`, `react.md`, `data-fetching.md`, `api-client.md`, `accessibility.md`, `i18n.md`, `testing.md`, plus `nextjs.md` or `expo.md` for the app).

1. Find the feature in the specs (product spec, student app outline, teacher portal outline). If it is not specified, or the backend endpoint does not exist yet, stop and ask.
2. Read the framework docs for the installed version (Next.js bundled docs or the versioned Expo docs) for every API you will use.
3. If the backend changed, update the API client first (`update-api-client` skill).
4. Create `src/features/<feature>/` in the app with:
   - `api.ts`: query-key factory and TanStack Query hooks over the generated client;
   - `schemas.ts`: zod schemas for forms and params (reuse `@keoshaa/core`);
   - `components/`: the feature's components (small, typed, accessible);
   - `index.ts`: the public exports other code may use;
   - tests next to the code.
5. Add the route or screen in `src/app/` that only composes the feature.
6. Add every string to `packages/i18n` in English and Nepali.
7. Handle loading, empty, error, no-connection and rate-limited states.
8. Tests per `testing.md` (states, form errors, accessibility queries).
9. Update docs and release notes (`documentation.md`).
10. Run `npm run verify`, report results and performance numbers for the screen. The developer runs the review manually.
