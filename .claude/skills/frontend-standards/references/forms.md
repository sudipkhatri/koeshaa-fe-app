# Forms

React Hook Form with the zod resolver in both apps (to be added with the first form). Schemas come from `@keoshaa/core` when the rule is shared with the backend (password length, identifier, code).

## Rules

- Validate on the client for fast feedback; the backend is the authority. Map `ApiError.fieldErrors()` (`VALIDATION_ERROR` details) back onto the fields.
- Error messages are i18n keys (`password.tooShort`), translated at display time.
- Disable submit while a request is pending; never send twice.
- **Keep what the user typed on failure.** With no connection, the button reads "No connection" and the values stay (ACC-7.4 scenarios).
- Phone fields accept any common form (`98…`, `+977 98…`, spaces); normalise with `normalisePhone` before sending.
- One identifier box for sign-in (phone, email or username), detected with `detectIdentifier` to pick the keyboard (ACC-7.1).
- Passwords: show/hide toggle, no paste blocking, no composition rules beyond the minimum length (ACC-7.2).
- Codes: numeric keyboard, one-time-code autofill (`autoComplete="one-time-code"` / `textContentType="oneTimeCode"`), countdown before "Send again" (ACC-7.4).
- Every field has a visible label; placeholders are hints, not labels.
