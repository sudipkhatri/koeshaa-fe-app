# Expo (apps/mobile)

Expo SDK 57, React Native 0.86, Expo Router, New Architecture. **Before writing mobile code, read the matching versioned docs** (`https://docs.expo.dev/versions/v57.0.0/`, index at `https://docs.expo.dev/llms.txt`); Expo changes APIs every SDK (see `apps/mobile/AGENTS.md`). For example, `Stack` is no longer exported from the template's old paths, and React Native Testing Library 14 has an async `render`.

## Dependencies

- Add packages with `npx expo install <package>` (from `apps/mobile`) so versions match the SDK. Never plain `npm install` for anything with native code.
- Prefer Expo modules (`expo-secure-store`, `expo-sqlite`, `expo-image`, `expo-crypto`) over third-party equivalents.
- Run `npx expo-doctor` after dependency changes.

## Navigation

- Expo Router: routes live in `src/app/`; every file is a screen, `_layout.tsx` files define navigators. Non-route code stays outside `src/app/`.
- Screens compose feature components only. Typed routes are on (`experiments.typedRoutes`).
- Validate every route and deep-link param with zod before use (`security.md`).

## Native code and builds

- `ios/` and `android/` are generated (Continuous Native Generation). Never create or edit them; configure through `app.json` and config plugins.
- Builds and store submission through EAS (`npx eas-cli@latest build`); over-the-air updates through EAS Update on per-environment channels.
- Android first: test on a low-end Android device or emulator profile (2 GB RAM) before calling a screen done.

## Platform rules

- Safe areas via `react-native-safe-area-context`; never hard-code status bar heights.
- Respect system font scaling; layouts must not clip at 1.3× text size.
- Back button (Android) and swipe-back (iOS) must work on every screen.
- Permissions (camera, notifications) are requested at the moment of use with an explanation, never at launch.
