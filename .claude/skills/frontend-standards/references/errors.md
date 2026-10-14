# Errors

Two error types reach the UI: `ApiError` (the backend answered with an error envelope) and `NetworkError` (no answer). Everything else is a bug.

## Rules

- Switch on `ApiError.code`; show `t("errors.<CODE>")` with a generic fallback (`errors.unknown`). Never show or parse the backend's message text (English-only, not meant for display).
- Field errors (`VALIDATION_ERROR` details) go onto their fields (`forms.md`).
- `NetworkError`: say "No connection", keep the user's input, offer retry.
- `429`: show when to retry (`retryAfterSeconds`), disable the action until then.
- `401` / `403`: handled by the session layer (refresh or sign out) and the screen (show "You cannot do this"), never by silently retrying.
- Route-level error boundaries: Next.js `error.tsx` per route group; Expo Router `ErrorBoundary` export per layout. They show a friendly screen with retry and the request id.
- Never swallow an error: either handle it visibly or let it reach the boundary and error reporting.
- Unexpected errors are reported with context (screen, request id, app version), never with tokens or personal data (`observability.md`).
