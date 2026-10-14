# 0002. API types generated from the backend's OpenAPI schema

- Status: Accepted
- Date: 2026-10-14

## Context

The backend (FastAPI) publishes an OpenAPI schema with every route, body and response, wrapped in a standard envelope with stable error codes. Hand-written frontend types drift silently.

## Decision

- `packages/api-client/openapi.json` is a committed snapshot of the backend schema; `src/schema.ts` is generated from it with `openapi-typescript` and never edited by hand.
- Requests go through `openapi-fetch`, typed by that schema. A thin wrapper adds the access token, turns error envelopes into `ApiError` (status, code, field details, request id, retry time) and connection failures into `NetworkError`.
- CI regenerates `schema.ts` and fails if it differs from the committed file.

## Consequences

- Backend changes reach the frontend as compile errors, not runtime surprises.
- Updating the client is an explicit step (`npm run api:fetch && npm run api:generate`) reviewed like code.
- The snapshot must be refreshed when the backend changes; until then, the apps build against the old contract.
