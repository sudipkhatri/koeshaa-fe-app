# Keoshaa App

The Keoshaa web app (Next.js) and mobile app (Expo), with shared TypeScript packages. The backend lives in a separate repository (`keoshaa-be`).

## Quick start

```bash
nvm use            # Node 24
npm install
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
npm run dev:web    # http://localhost:3000
npm run dev:mobile # Expo dev server; press "a" for Android
```

The apps expect the backend at `http://localhost:8000` by default (see [Configuration](docs/reference/configuration.md)).

## Before you push

```bash
npm run verify
```

Standards, workflow and review: [`AGENTS.md`](AGENTS.md) and [`.claude/skills/frontend-standards/`](.claude/skills/frontend-standards/SKILL.md). Docs: [`docs/`](docs/index.md).
