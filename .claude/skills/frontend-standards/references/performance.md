# Performance

Users are on low-end Android phones and 2G/3G. The spec's budget: sign-in, code entry and sign-up work on 2G, each step sending under 20 KB.

## Budgets

| What                                                | Budget                            |
| --------------------------------------------------- | --------------------------------- |
| Each sign-in / sign-up step (request + response)    | < 20 KB                           |
| Web public page, first load JS (gzip)               | < 150 KB                          |
| Web signed-in route, first load JS (gzip)           | < 250 KB                          |
| Web LCP on a mid Android over 4G                    | < 2.5 s                           |
| Mobile cold start to first screen (low-end Android) | < 2 s                             |
| Mobile JS bundle (Hermes bytecode)                  | Report on every dependency change |

## Rules

- Measure, do not guess. Any change on a hot screen or adding a dependency reports numbers: `next build` route sizes for the web, `npx expo export` bundle size for mobile, and timings on a low-end device profile.
- Prefer platform features and small libraries; check a dependency's size before adding it.
- Virtualise long lists (`FlashList` on mobile, windowing on the web); stable keys; no inline functions recreated per row when measured to matter.
- Images: sized to their display box, modern formats, lazy below the fold; `expo-image` with caching on mobile.
- Split code by route; load heavy screens (games, labs) on demand.
- No request waterfalls: fetch in parallel, prefetch the next likely screen.
- Avoid re-render storms: keep server data in TanStack Query, select only the fields a component needs.
