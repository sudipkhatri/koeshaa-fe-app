# API client

The backend's OpenAPI schema is the contract. `packages/api-client` turns it into TypeScript types and a typed client; nothing about the API is written by hand ([ADR 0002](../../../../docs/adr/0002-generated-api-client.md)).

## Updating after a backend change

```bash
npm run api:fetch      # downloads API_SCHEMA_URL (default http://localhost:8000/openapi.json) into openapi.json
npm run api:generate   # regenerates packages/api-client/src/schema.ts
npm run typecheck      # every caller of a changed endpoint now fails to compile
```

Commit `openapi.json` and `src/schema.ts` together with the code that adapts to them. CI regenerates and fails if they differ. Never edit `src/schema.ts` by hand.

## Using it

- Call through the app's client (`apps/*/src/lib/api.ts`) inside feature `api.ts` hooks only.
- Paths and bodies are typed from the schema: `api.POST("/api/v1/auth/sign-in", { body })`.
- Success responses are the envelope `{ success, data, meta }`; unwrap `data` in the hook.
- Errors are thrown as `ApiError` (status, stable `code`, field `details`, `requestId`, `retryAfterSeconds`) or `NetworkError`. Switch on `code`; the list of codes per endpoint is in the backend docs (for sign-in: `docs/engines/sign-in-api.md` in the backend repo).
- Web sends `X-Auth-Mode: cookie` and `credentials: "include"` so the refresh token stays in the backend's cookie. Mobile sends the refresh token in the body from secure storage.

## Never

- Hand-written request or response types for backend endpoints.
- Parsing error `message` text.
- Calling the backend from a Next.js server component with a user's token.
