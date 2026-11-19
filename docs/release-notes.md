# Release notes

Every merged change adds a line under **Unreleased** in the right section.

## [Unreleased]

### Added

- Mobile app now uses the real backend where it exists: sign in (new-device code, lock and rate limits), sign up, forgot and reset password, refresh and sign out (this device or all).
- Mobile Me (name, devices, second-device notice, parent invite, change password, close account), class and stream pick, subjects from the student's enrollment, and Terms and Privacy from the site pages. Chapters, lessons, progress, streak and Search are demo mode only: real students see "coming soon" or nothing.
- Mobile screens show "No connection" with retry when the phone is offline and data is missing (offline use itself is not V1). Failures are reported once from the query and mutation caches (5xx and unknown only, no personal data); `errorMessage` is pure.
- Known gap: no crash or error reporting service is chosen yet. `setErrorReporter` is pluggable and nothing is registered, so release builds report nothing. Decide before the first release to real users.
- Mobile plumbing: TanStack Query, secure token storage, React Hook Form with zod, MSW tests and one error-mapping function (`lib/errors.ts`).
- `EXPO_PUBLIC_API_URL` sets the backend, `EXPO_PUBLIC_USE_MOCKS=1` keeps the full demo (dev only). See [Mobile with the backend](how-to/mobile-with-the-backend.md).
- The generated API client was refreshed from the backend `dev` schema (139 paths).
- Mobile prototype app (local mock data only, no backend calls): tabs (Home, Learn, Search, Me), Home with continue hero, subjects, free chapters and daily goal, Learn grid with subject, chapter and lesson placeholder screens (locked chapters open a coming-soon sheet), Search with recent and popular chips, highlight, did-you-mean and slow-down states, Me with devices, linked parent, settings, terms and privacy, close account and sign out, and the onboarding flow (splash, language, role, welcome, sign in with lockout, code entry, forgot password, create account with under-13 path, consents, class and stream pickers). Demo credentials are in [Mobile with the backend](how-to/mobile-with-the-backend.md). Each feature keeps its demo data in a `mock.ts` behind small typed functions for the backend to replace.
  Start on onboarding with `EXPO_PUBLIC_START_AT_ONBOARDING=1`, or long-press the Home avatar in a dev build for shortcuts.
- Approved Book buddy logo and tagline wired into the app icon, splash, welcome screen and strings (`brand.tagline`, `brand.dailyHabit`).
- Mobile design foundation from the approved prototype: Playful Indigo tokens (light and dark, English and Nepali), NativeWind styling, Baloo 2 fonts, saved theme and language choices, the `components/ui` building blocks (Screen, Text, Button, Card, ListRow, Chip, TextField, Sheet, StateView, Kiko mascot, SubjectTile, tab bar look) and a dev-only Kit screen at `/kit`. `npm run tokens:generate` regenerates the web and mobile themes from `@keoshaa/tokens`.
- Repository skeleton: npm workspaces with Turborepo, a Next.js 16 web app and an Expo SDK 57 mobile app, both showing a placeholder home screen (English by default, Nepali supported).
- Shared packages: a typed API client generated from the backend's OpenAPI schema (78 endpoints, including the sign-in engine), core logic (response envelope, `ApiError`/`NetworkError`, identifier and phone rules matching the backend, password and code validation), Nepali and English strings, and design tokens.
- Frontend engineering standards, the `/review` command and the `code-reviewer`, `test-writer` and `docs-writer` agents.
- `npm run verify` (format, typecheck, lint, tests, build), a pre-commit hook and a CI workflow.

### Changed

- Design token names are now semantic (`primary`, `onPrimary`, `reward`, ...) with `light` and `dark` sets; the web `@theme` is generated, and the web placeholder uses `text-primary`.
- Minimum touch target raised from 44 to 48 (`minTouchTarget` in `@keoshaa/tokens`).
- Frontend standards updated: styling (NativeWind 4 on mobile, Tailwind v4 on web, both generated; arbitrary Tailwind values now fail lint), the `components/ui` list is the minimum set, and "Current state" reflects what is built.
- Token drift tests now live with each generated file's owner (web and mobile apps); `tokens:generate` sits next to `api:generate`.
