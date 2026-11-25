# Mobile with the backend

The mobile app talks to the real backend (`keoshaa-be`, branch `dev`) wherever an endpoint exists and keeps demo data for the rest. `EXPO_PUBLIC_USE_MOCKS=1` switches everything back to demo data (for demos without a backend).

## Start

Steps 1 and 2 run in the `keoshaa-be` directory; steps 3 to 5 run in the `keoshaa-app` directory (the repo root).

1. In `keoshaa-be`: `docker compose up -d postgres redis`, `uv run alembic upgrade head`, `uv run python -m app.cli.sync_rbac`, `uv run python -m app.cli.sync_curriculum`.
2. Start the API so codes are readable: `AUTH_DEV_LOG_CODES=true uv run fastapi dev app/main.py --host 0.0.0.0 --port 8000 2>&1 | tee api.log`. New-device and sign-up codes then appear in `keoshaa-be/api.log` (`dev sign-in code ... code=123456`).
3. Create the test student (class 10, the seeded class with a published subject pool): `API_LOG=../keoshaa-be/api.log node apps/mobile/scripts/seed-dev-student.mjs`. Phone and password are in `apps/mobile/.env.example`.
4. `npm run api:fetch && npm run api:generate` after backend changes ([update the API client](update-api-client.md)).
5. `npm run dev:mobile`. The simulator uses `http://localhost:8000`; a phone on Wi-Fi needs `EXPO_PUBLIC_API_URL=http://<Mac LAN IP>:8000`.

A new simulator or install is a new device: signing in asks for a code, which you read from `keoshaa-be/api.log`.

## Demo mode credentials

With `EXPO_PUBLIC_USE_MOCKS=1` (dev builds only): password `keoshaa123`, code `123456`, username `aarav` sends the code to a parent, `sita` is a known device.

## What is real and what is demo data

| Area                                                                                                    | Source                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Sign in (new-device code, authenticator, one-time recovery codes, lock, rate limits), refresh, sign out | API (`/auth/*`)                                                                                                      |
| Sign up (student or parent), forgot and reset password, support call-back, consents                     | API; consent versions from the terms and privacy pages, else the backend default                                     |
| Name, devices (list, sign out one), second-device notice, parent invite, close account, change password | API (`/me/*`)                                                                                                        |
| Parent children list, add child, child devices / password / close                                       | API (`/me/children*`); class/stream on the list and parent→child invite are not yet                                  |
| Alerts inbox (list, mark read, mark all read)                                                           | API (`/notifications*`); title/body come from the server                                                             |
| Guardian invite (student→parent), accept / decline (parent)                                             | API (`/me/guardian-invitations*`, `/me/guardianships/{id}`); student name on accept missing                          |
| Class, stream, optional subjects, enrol confirm                                                         | API (`/me/enrollments*`, catalog pool); parent phone on confirm is optional                                          |
| Enrolment manage (class/subjects, self-serve fix, ask for change)                                       | API (`window_open` / `changes_left`, corrections via pick-class, `change-requests`); history list not on student API |
| Subjects, free chapter names                                                                            | API (`/me/enrollments`, `/catalog`); lesson bodies are still "coming soon"                                           |
| Terms and Privacy text                                                                                  | API (`/site-pages/{slug}`), summary text until staff publish a page                                                  |
| Lesson bodies, progress, streak, daily goal, answers                                                    | Demo mode only; a real chapter shows "coming soon" until the backend has the lesson                                  |
| Search                                                                                                  | Demo mode only; real students see "Search is coming soon"                                                            |

Sessions: the refresh token lives in `expo-secure-store`, the access token in memory. One refresh runs at a time for all requests; a refresh rejected with `TOKEN_INVALID`, `SESSION_ENDED` or `SIGNED_OUT_FOR_DEVICE` signs the person out, a network failure does not.

Every failure goes through `lib/errors.ts`, which maps the backend `code` to a message in both languages (`errors.<CODE>` in `@keoshaa/i18n`); the server's message text is never shown.
