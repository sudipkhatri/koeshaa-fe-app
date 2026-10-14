# Configuration

Copy each app's `.env.example` to a local file (`apps/web/.env.local`, `apps/mobile/.env`). Real env files are never committed.

Variables prefixed `NEXT_PUBLIC_` or `EXPO_PUBLIC_` are built into the app and visible to every user: never put secrets in them.

| Variable                   | App     | Default                              | Description                                                         |
| -------------------------- | ------- | ------------------------------------ | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | web     | `http://localhost:8000`              | Backend base URL, no trailing slash                                 |
| `EXPO_PUBLIC_API_BASE_URL` | mobile  | `http://localhost:8000`              | Backend base URL; on an Android emulator use `http://10.0.2.2:8000` |
| `API_SCHEMA_URL`           | tooling | `http://localhost:8000/openapi.json` | Where `npm run api:fetch` downloads the OpenAPI schema              |

The backend must list the web app's origin in its `AUTH_ALLOWED_ORIGINS` for cookie-based refresh to work.
