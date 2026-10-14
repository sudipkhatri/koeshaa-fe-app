# Observability

## Rules

- No `console.log` in shipped code (lint warns); use a small logger in `lib/` that is silent in production except for errors.
- Unexpected errors go to error reporting (to be chosen before the first real users) with: app, version, platform, screen or route, request id from `ApiError.requestId`.
- Never send tokens, passwords, codes, phone numbers, emails, names or children's data to logs, error reports or analytics.
- Analytics events, when added, are named by product action (`sign_in_completed`), documented, and limited to what the spec allows for children.
- Show the request id on error screens so support can find the backend log.
