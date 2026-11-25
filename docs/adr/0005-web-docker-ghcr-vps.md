# 0005. Web deploy via Docker, GHCR and VPS SSH

- Status: Accepted
- Date: 2026-11-25

## Context

The monorepo has a Next.js web app and an Expo mobile app. We need a repeatable production path for web only. The Eventix frontend already deploys with a multi-stage Docker image, GitHub Container Registry, and SSH + `docker compose` on a VPS. Mobile will use a different pipeline later.

## Decision

- Build the web app with Next.js `output: 'standalone'` and `outputFileTracingRoot` at the monorepo root so shared packages are traced into the image.
- Use a multi-stage Dockerfile at `.docker/server/Dockerfile` (local parity at the repo root). Context is the monorepo root; mobile source is excluded via `.dockerignore`.
- Publish images to GHCR from GitHub Actions; tag `DEV.*` from `dev` and `PROD.*` from `main`.
- Deploy by SSH into the VPS, pull the tagged image, and `docker compose up` with a health check.
- Bake `NEXT_PUBLIC_API_BASE_URL` at image build time (not a runtime secret).

## Consequences

- Web and mobile stay one repo, but only web is containerised this way.
- Changing the public API base URL requires a rebuild and redeploy.
- PROD is the same workflow shape as DEV with different secrets and branch; DEV is the template to copy when going live.
- Operators must keep the VPS compose file's image name aligned with the GitHub repository path on GHCR.
