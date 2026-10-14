# 0003. Where each app keeps its session tokens

- Status: Accepted
- Date: 2026-10-14

## Context

The backend's sign-in engine (backend ADR 0013) issues a 15-minute access token carrying a session id and a rotating refresh token. Browsers can receive the refresh token as an `HttpOnly` cookie scoped to `/api/v1/auth` (`X-Auth-Mode: cookie`); mobile apps receive it in the response body. A replayed refresh token ends the session.

## Decision

- **Web:** access token in memory only; refresh token only in the backend's `HttpOnly` cookie. Signed-in pages are client components that call the backend directly; the Next.js server never holds a user's tokens.
- **Mobile:** access token in memory; refresh token and device id in `expo-secure-store`.
- Both: refreshes are single-flight (one at a time, shared by all waiting requests), and sign-out clears local state even if the network call fails.

## Consequences

- No token is readable by page scripts on the web, and none sits in plain storage on the phone.
- Reloading a web page needs one refresh call to get a new access token.
- Server-rendered pages cannot show signed-in data; signed-in areas render on the client.
