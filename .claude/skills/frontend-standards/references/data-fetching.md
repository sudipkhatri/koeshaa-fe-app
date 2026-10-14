# Data fetching

Server data is cached, shared and kept fresh with **TanStack Query** in both apps. Components never call `fetch` or the API client directly.

## Where code lives

- `features/<feature>/api.ts`: query-key factory, `useXQuery` / `useXMutation` hooks built on `@keoshaa/api-client`.
- Query keys are arrays from a factory (`studentKeys.detail(id)`), never ad-hoc strings.
- Hooks unwrap the envelope and return the typed `data`; screens never see the envelope.

## Rules

- Do not retry `4xx` (`ApiError` with status < 500). Retry `NetworkError` and `5xx` a bounded number of times with backoff.
- Mutations invalidate or update exactly the queries they affect; no blanket `invalidateQueries()`.
- Lists use the backend's cursor pagination with `useInfiniteQuery`; never load "all".
- Disable a query until its inputs are known (`enabled`), instead of firing with `undefined`.
- Optimistic updates only where the spec wants instant feedback, always with rollback on error.
- Stale times are chosen per data type and written next to the query (content that rarely changes: long; progress and inbox: short).
- On `401` with `SESSION_ENDED` / `TOKEN_INVALID`, the session layer refreshes once (single-flight for all parallel requests) and retries; if refresh fails it signs out. `SIGNED_OUT_FOR_DEVICE` signs out and shows the message naming the device (ACC-9.3).
- `429` shows the server's retry time (`retryAfterSeconds`, or the message for `TOO_MANY_CODES`) and disables the action until then.

## Mobile

- Persist the query cache for offline-tolerant screens only after `offline.md` is in place; never persist secrets or another user's data across sign-out.
- Refetch on app foreground and on reconnect, not on every focus.
