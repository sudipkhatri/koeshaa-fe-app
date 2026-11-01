# Keoshaa App (web + mobile)

TypeScript monorepo for the Keoshaa frontends. The backend is a separate repo (`keoshaa-be`, FastAPI); this repo talks to it only through its HTTP API.

## Stack

npm workspaces · Turborepo · TypeScript 6 (strict) · React 19
Web: Next.js 16 (App Router, Turbopack) · Tailwind v4 · Vitest + Testing Library
Mobile: Expo SDK 57 · React Native 0.86 · Expo Router · Jest (`jest-expo`) + React Native Testing Library
Shared: generated API client (`openapi-typescript` + `openapi-fetch`) · zod · Prettier · ESLint · Husky

## Commands

- Install: `npm install` (Node 24, see `.nvmrc`)
- Web dev server: `npm run dev:web`
- Mobile dev server: `npm run dev:mobile` (Expo; press `a` for Android)
- Verify (format check + typecheck + lint + test + build): `npm run verify`
- Format: `npm run format`
- Refresh API types from the backend: `npm run api:fetch && npm run api:generate`
- Add a mobile dependency: `cd apps/mobile && npx expo install <package>`

## Layout

```
apps/
  web/                    # Next.js: public pages, teacher portal, admin, parent web
  mobile/                 # Expo: student and parent apps (Android first)
packages/
  api-client/             # OpenAPI snapshot, generated types, typed client
  core/                   # platform-free logic: envelope, errors, validation, identifiers, session interfaces
  i18n/                   # English (default) and Nepali strings
  tokens/                 # design tokens
docs/                     # architecture, ADRs, configuration, how-tos, release notes
.claude/                  # frontend-standards skill, /review, agents
```

Each app has its own `AGENTS.md` from its framework (`apps/web/AGENTS.md`, `apps/mobile/AGENTS.md`): read it before working in that app.

## Engineering standards

`.claude/skills/frontend-standards/` is the single source of truth for engineering standards (architecture, TypeScript, React, Next.js, Expo, data fetching, API client, forms, styling, accessibility, i18n, performance, offline, security, errors, testing, observability, documentation, scored review). Read its `SKILL.md` before any task and load the references it lists.

## Non-negotiables

1. **Read the framework docs for the installed version** before writing Next.js or Expo code (Next.js: `node_modules/next/dist/docs/`; Expo: `https://docs.expo.dev/versions/v57.0.0/`). Never write framework code from memory.
2. Apps depend on packages; packages never import apps; the apps never import each other. Share logic, not screens.
3. API types come only from the generated client. Never hand-write backend types or edit `packages/api-client/src/schema.ts`.
4. Never store tokens in `localStorage`, `sessionStorage` or `AsyncStorage`; never put secrets in `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*`; never log tokens or personal data.
5. The backend authorises. The UI may hide actions but is never the only permission check.
6. Every user-visible string from `@keoshaa/i18n` (Nepali and English); every colour and size from `@keoshaa/tokens`.
7. Every screen handles loading, empty, error and no-connection states, and keeps user input on failure.
8. Code style: strict types, no `any`, small components and hooks, clear names, no narrating comments. Soft max ~250 lines per file, hard max 400.
9. Every behaviour change ships with tests; `npm run verify` green before handing over.

## Working agreement

- Plan first for new features, new screens with server data, or work over ~3 files.
- Ask when product requirements are ambiguous; do not invent screens or flows from incomplete specs.
- Keep diffs small. Do not refactor unrelated code.
- Skills: `frontend-standards`, `new-feature`, `update-api-client`. Subagents: `code-reviewer`, `test-writer`, `docs-writer`. The delivery agents (`planner`, `web-dev`, `mobile-dev`, `test-engineer`, `reviewer`, `release-engineer`) live in `../keoshaa-be/.claude/agents/` and follow this file when working here.
- Code review: developers run `/review` (scored against the standards via `code-reviewer`). It is the only official review and is never run automatically.
