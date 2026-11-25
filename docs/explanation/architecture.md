# Architecture

```
apps/web  ─┐                     ┌─ packages/api-client  (generated from the backend's OpenAPI)
           ├─ import ──────────▶ ├─ packages/core        (envelope, errors, validation, identifiers)
apps/mobile┘                     ├─ packages/i18n        (Nepali, English)
                                 └─ packages/tokens      (design tokens)
```

- **Web** (`apps/web`, Next.js): public pages render on the server; signed-in areas (teacher portal, admin, school portal, parent web) render on the client and call the backend directly ([ADR 0003](../adr/0003-session-tokens-web-and-mobile.md)). The public home page explains the product for students, parents and schools. The admin area at `/admin` covers school leads, schools, platform settings, notification webhooks, the delivery log, and site pages. The school staff portal at `/school` covers Overview, People and School details for organisations the person belongs to (`GET /api/v1/me/schools`). `/schools` is the public enquiry form.
- **Mobile** (`apps/mobile`, Expo): the student and parent apps, Android first, built to work offline.
- **Packages** hold everything both apps need to agree on. Screens are not shared ([ADR 0001](../adr/0001-monorepo-web-and-mobile.md)).
- **Backend contract**: the OpenAPI snapshot in `packages/api-client` ([ADR 0002](../adr/0002-generated-api-client.md)).

Inside each app, routes live in `src/app/` and only compose feature code from `src/features/<feature>/`; see the [architecture standard](../.claude/skills/frontend-standards/references/architecture.md).
