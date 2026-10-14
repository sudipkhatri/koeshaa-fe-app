# Release notes

Every merged change adds a line under **Unreleased** in the right section.

## [Unreleased]

### Added

- Repository skeleton: npm workspaces with Turborepo, a Next.js 16 web app and an Expo SDK 57 mobile app, both showing a placeholder home screen (English by default, Nepali supported).
- Shared packages: a typed API client generated from the backend's OpenAPI schema (78 endpoints, including the sign-in engine), core logic (response envelope, `ApiError`/`NetworkError`, identifier and phone rules matching the backend, password and code validation), Nepali and English strings, and design tokens.
- Frontend engineering standards, the `/review` command and the `code-reviewer`, `test-writer` and `docs-writer` agents.
- `npm run verify` (format, typecheck, lint, tests, build), a pre-commit hook and a CI workflow.
