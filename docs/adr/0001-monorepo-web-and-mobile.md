# 0001. One monorepo for web and mobile; share logic, not screens

- Status: Accepted
- Date: 2026-10-14

## Context

Keoshaa needs a mobile app for students and parents (offline, 2G, low-end Android, secure token storage, push notifications) and a web app for teachers, school staff, admins and public pages (tables, PDFs, imports, projector mode). Both talk to the same backend and must agree on API types, validation rules, strings and design.

## Decision

- One TypeScript repository with npm workspaces and Turborepo: `apps/web` (Next.js), `apps/mobile` (Expo), and shared `packages/` (`api-client`, `core`, `i18n`, `tokens`).
- **Share logic, not screens.** API types, validation, error handling, identifier rules, strings and design tokens are shared. UI components are built separately per platform; no cross-platform UI kit (React Native Web, Tamagui) for now.
- Expo (React Native) for mobile because offline storage, secure storage, device identity and push are first-class; Next.js for the web because the teacher portal and public pages need server rendering and rich desktop UI.

## Consequences

- A backend change that breaks a shared type fails both apps' builds at once.
- Screens are written twice where both apps need them (e.g. sign-in); the logic behind them is not.
- One React version must serve both apps (currently 19.2.3, the version Expo SDK 57 pins).
- Revisit sharing UI if the duplicated screen count grows large.
