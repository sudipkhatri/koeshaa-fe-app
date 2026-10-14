# Testing — mandatory

Code is not complete until tests exist and `npm run verify` is green.

## Tools

| Where             | Runner                     | Library                                               |
| ----------------- | -------------------------- | ----------------------------------------------------- |
| `packages/*`      | Vitest                     | —                                                     |
| `apps/web`        | Vitest (jsdom)             | Testing Library (`@testing-library/react`)            |
| `apps/mobile`     | Jest (`jest-expo`)         | React Native Testing Library 14 (`await render(...)`) |
| Web end-to-end    | Playwright (not yet built) | —                                                     |
| Mobile end-to-end | Maestro (not yet built)    | —                                                     |

## What must be tested

| Change                                                 | Required tests                                                                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Logic in `packages/` or a hook                         | Unit tests: success, each failure branch, edge cases (empty, max, unicode, Nepali text)                                             |
| Screen or component with server data                   | Loading, success, empty, `ApiError` (each code the screen handles), `NetworkError`, and 401 handled by the session                  |
| Form                                                   | Valid submit, client validation errors, server `VALIDATION_ERROR` mapped to fields, no double submit, values kept on `NetworkError` |
| Navigation or deep link                                | Valid and invalid params                                                                                                            |
| Bug fix                                                | A regression test that fails before the fix                                                                                         |
| Shared token, string or rule mirrored from the backend | A test that ties it to its source (as `tokens.test.ts` and the identifier tests do)                                                 |

## Conventions

- Test behaviour through what the user sees: query by role, label and text. No snapshot tests of whole screens.
- Mock the network at the fetch level (MSW, once added), not internal modules.
- Tests are isolated and order-independent; no real timers or sleeps (use fake timers).
- Name tests by behaviour: `shows the retry time when codes are rate limited`.
- Strings in assertions come from the i18n catalogue or are the Nepali/English literal on purpose.

## Never

- Weaken or delete a failing test to make it pass; report the bug.
- Test implementation details (internal state, private helpers) when behaviour covers them.
