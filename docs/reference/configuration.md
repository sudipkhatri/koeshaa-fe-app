# Configuration

Copy each app's `.env.example` to a local file (`apps/web/.env.local`, `apps/mobile/.env`). Real env files are never committed.

Variables prefixed `NEXT_PUBLIC_` or `EXPO_PUBLIC_` are built into the app and visible to every user: never put secrets in them.

| Variable                          | App     | Default                              | Description                                                                                                                                                                                                                                   |
| --------------------------------- | ------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`        | web     | `http://localhost:8000`              | Backend base URL, no trailing slash. Inlined at build time. Local: `.env.local`. Docker/CI: build-arg (DEV secret `DEV_NEXT_PUBLIC_API_BASE_URL`, PROD secret `NEXT_PUBLIC_API_BASE_URL`). See [Deploy the web app](../how-to/deploy-web.md). |
| `EXPO_PUBLIC_API_URL`             | mobile  | `http://localhost:8000`              | Backend base URL; release builds require an `https` URL; Android emulator `http://10.0.2.2:8000`; a phone on Wi-Fi needs the Mac's LAN IP                                                                                                     |
| `EXPO_PUBLIC_USE_MOCKS`           | mobile  | unset                                | Dev only: `1` runs every screen on local demo data (no backend); ignored in release builds                                                                                                                                                    |
| `EXPO_PUBLIC_START_AT_ONBOARDING` | mobile  | unset                                | Dev only: `1` starts the app on the onboarding flow                                                                                                                                                                                           |
| `API_SCHEMA_URL`                  | tooling | `http://localhost:8000/openapi.json` | Where `npm run api:fetch` downloads the OpenAPI schema                                                                                                                                                                                        |

The backend must list the web app's origin in its `AUTH_ALLOWED_ORIGINS` for cookie-based refresh to work.
