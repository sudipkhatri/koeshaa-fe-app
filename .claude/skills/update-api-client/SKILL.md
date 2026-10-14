---
name: update-api-client
description: Refresh the generated API types from the backend's OpenAPI schema and fix every caller that no longer compiles. Use after a backend change or before building against a new endpoint.
---

# Update the API client

Follow `frontend-standards/references/api-client.md`.

1. Make sure the backend is running locally (or set `API_SCHEMA_URL`).
2. `npm run api:fetch` then `npm run api:generate`.
3. Review the diff of `packages/api-client/openapi.json`: list added, changed and removed endpoints and fields for the report.
4. `npm run typecheck` and fix every caller that broke. Never edit `src/schema.ts` by hand and never loosen types to make it compile.
5. Add or update tests for behaviour that changed (new error codes, renamed fields).
6. Add a release-notes entry if users or testers notice the change.
7. Run `npm run verify` and report the endpoint changes and what was adapted.
