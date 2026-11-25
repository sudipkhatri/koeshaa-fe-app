# Deploy the web app

The web app ships as a Docker image to a VPS. Mobile is not part of this path. CI still runs `npm run verify` on pull requests; deploy is a separate workflow.

## What runs where

| Trigger                    | Workflow              | Image tag       | Secrets prefix                                              |
| -------------------------- | --------------------- | --------------- | ----------------------------------------------------------- |
| Push to `dev` (or manual)  | `deploy-web-dev.yml`  | `DEV.<ddHHMM>`  | `DEV_*`                                                     |
| Push to `main` (or manual) | `deploy-web-prod.yml` | `PROD.<ddHHMM>` | prod server secrets + unprefixed `NEXT_PUBLIC_API_BASE_URL` |

Flow: GitHub Actions builds [`.docker/server/Dockerfile`](../../.docker/server/Dockerfile) → pushes to GHCR → SSH into the VPS → `docker compose up` → health check.

`NEXT_PUBLIC_API_BASE_URL` is a **build-arg** (inlined into the client). Set it per environment in GitHub secrets; see [Configuration](../reference/configuration.md).

## Build locally

From the repo root:

```bash
docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com
docker compose up -d
```

Open `http://localhost:3000`. Stop with `docker compose down`.

## Ports (DEV VPS)

The container listens on **3000** inside. On the shared DEV host, publish **3004** so we do not collide with other frontends:

| Host port        | Service                    |
| ---------------- | -------------------------- |
| 3003             | theeventix-fe              |
| 3004             | **keoshaa-web** (this app) |
| 3005             | theeventix-admin-fe        |
| 3006             | theeventix-organiser-fe    |
| 8001 (localhost) | keoshaa-dev-api            |

Local `docker compose` still maps `3000:3000`.

## First-time VPS setup (DEV)

1. Create an external Docker network once:

```bash
docker network create keoshaa
```

2. Create a work directory and copy [`.docker/server/docker-compose.yaml`](../../.docker/server/docker-compose.yaml) into it (this is `DEV_WORK_DIR`).

3. Ensure the deploy user can pull from `ghcr.io` (the workflow logs in with `GITHUB_TOKEN` on each deploy).

4. Add the GitHub Actions secrets listed below.

5. Push to `dev` or run **Deploy Web Application - DEV** manually.

6. Point the reverse proxy (or open) at host port **3004**. Bake `DEV_NEXT_PUBLIC_API_BASE_URL` to the public API URL (DEV API is on host `8001` via localhost bind — use the HTTPS URL nginx already exposes, not `http://127.0.0.1:8001` in the browser image).

PROD uses the same compose file and network pattern on the prod host; copy the DEV work-dir setup and set the prod secrets. Choose a free host port there if 3004 is taken.

## GitHub secrets

### DEV

| Secret                         | Purpose                                           |
| ------------------------------ | ------------------------------------------------- |
| `DEV_NEXT_PUBLIC_API_BASE_URL` | Backend base URL baked into the image             |
| `DEV_SERVER_IP`                | VPS host                                          |
| `DEV_SERVER_USER`              | SSH user                                          |
| `DEV_SERVER_SSH_KEY`           | Private key for that user                         |
| `DEV_WORK_DIR`                 | Absolute path to the compose directory on the VPS |

### PROD

| Secret                     | Purpose                                           |
| -------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL baked into the image             |
| `PROD_SERVER_IP`           | VPS host                                          |
| `PROD_SERVER_USER`         | SSH user                                          |
| `PROD_SERVER_SSH_KEY`      | Private key for that user                         |
| `PROD_WORK_DIR`            | Absolute path to the compose directory on the VPS |

### Optional

| Secret            | Purpose                                                       |
| ----------------- | ------------------------------------------------------------- |
| `DISCORD_WEBHOOK` | Deploy start / success / failure messages; skipped when unset |

## Image name

Workflows push to `ghcr.io/<github-owner>/<repo>:<tag>` (lowercased). The VPS compose file expects `ghcr.io/sudipkhatri/koeshaa-fe-app`. If the GitHub owner or repo name changes, update [`.docker/server/docker-compose.yaml`](../../.docker/server/docker-compose.yaml) to match.
