# 0004. NativeWind 4 styled from generated token themes

- Status: Accepted
- Date: 2026-11-18

## Context

Both apps must look like the approved "Playful Indigo" prototype, in light and dark, from one set of values. Web uses Tailwind 4. Mobile needs Tailwind-style classes in React Native.

## Decision

- Mobile uses **NativeWind 4.2.7** (Tailwind 3). Its release notes add Expo SDK 57 support; NativeWind 5 is still a release candidate. Revisit when v5 is stable.
- `@keoshaa/tokens` holds every value (light and dark). `npm run tokens:generate` writes the web `@theme`, the mobile `global.css` (CSS variables that switch with the colour scheme) and the mobile Tailwind theme. A test fails when a generated file drifts.
- Preferences (theme, language) are stored with AsyncStorage; they are not secrets.

## Consequences

- Two Tailwind majors live in the repo (4 for web, 3 for mobile); npm keeps each app on its own.
- Components use classes such as `bg-primary`; only icons, SVG and navigator options read colour values from `useTheme().colors`.
