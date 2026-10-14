# Security

The backend authenticates and authorises; the apps must not leak what they hold. Backend contract: sign-in engine ADR 0013 in the backend repo.

## Tokens and sessions

|                                  | Web                                                                                        | Mobile                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| Access token (15 min, has `sid`) | Memory only                                                                                | Memory only                            |
| Refresh token                    | Backend's `HttpOnly` cookie on `/api/v1/auth` (`X-Auth-Mode: cookie`); never visible to JS | `expo-secure-store` only               |
| Device id                        | Random, per browser profile                                                                | Random, per install, in secure storage |

- Never put tokens in `localStorage`, `sessionStorage`, `AsyncStorage`, URLs, logs or analytics.
- Refresh tokens rotate: keep only the newest, and send refreshes one at a time (two parallel refreshes with the same token end the session).
- Sign-out calls the backend first, then clears local state even if the call fails.
- Staff (platform) accounts use an authenticator app; show the setup secret once and never store it.

## Input and output

- Validate route params, deep links, QR codes and storage reads with zod before use.
- No `dangerouslySetInnerHTML` (web) or HTML rendering of user or imported content without a sanitiser.
- External links open with `rel="noopener noreferrer"` (web) and through the system browser (mobile).
- Never build URLs to other hosts from user input (open redirects).

## Configuration and secrets

- Anything prefixed `NEXT_PUBLIC_` or `EXPO_PUBLIC_` ships to every user: no secrets, keys or internal hostnames there.
- Real `.env` files are never committed (`.env.example` documents the variables).
- Web security headers: Content-Security-Policy, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`.

## Dependencies

- Add dependencies deliberately (size, maintenance, licence); mobile ones through `npx expo install`.
- Run `npm audit` before release; no known high or critical issues in shipped code.

## Privacy

- Children use the app: collect the minimum, no third-party trackers or ad SDKs, analytics only as the spec allows.
- The UI may hide actions a user cannot take, but a hidden button is never the security control.
