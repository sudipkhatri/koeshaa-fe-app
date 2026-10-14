# Update the API client

After the backend adds or changes an endpoint:

```bash
npm run api:fetch      # needs the backend running, or set API_SCHEMA_URL
npm run api:generate
npm run typecheck
```

Fix every place that no longer compiles, add tests for changed behaviour, and commit `packages/api-client/openapi.json` and `packages/api-client/src/schema.ts` with those changes. CI fails if `schema.ts` does not match the snapshot. Details: [api-client standard](../../.claude/skills/frontend-standards/references/api-client.md).
