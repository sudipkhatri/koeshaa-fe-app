# Next.js (apps/web)

Next.js 16 App Router with Turbopack. **Before writing web code, read the relevant guide in `node_modules/next/dist/docs/`** (`apps/web/AGENTS.md`); APIs and conventions differ from older versions (for example, Middleware is now **Proxy**, `proxy.ts`).

## Rendering

- Server Components by default. Add `"use client"` only to components that need state, effects, browser APIs or event handlers, and keep those leaves small.
- **Public pages** (landing, school contact form, legal pages) render on the server and stay static where possible.
- **Signed-in areas** (teacher portal, admin, parent web) render client components that call the backend directly with the in-memory access token. The Next.js server never holds a user's tokens and never proxies the backend for authentication ([ADR 0003](../../../../docs/adr/0003-session-tokens-web-and-mobile.md)).
- `cacheComponents` is enabled: follow the bundled caching guide; never cache anything user-specific on the server.

## Routing

- Route files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`) compose feature components only.
- Every signed-in route group has `loading.tsx` and `error.tsx`.
- Use typed routes and `Link`; no string-built URLs for internal links.
- Proxy (`src/proxy.ts`) only for redirects and headers (for example, sending signed-out users to sign-in as an optimistic check). Authorization is the backend's job; never treat a Proxy check as security.

## Configuration

- Browser-visible settings use `NEXT_PUBLIC_*` and are inlined at build time: they are public, never secrets. Read them in `src/lib/env.ts` only.
- Server-only settings never get the `NEXT_PUBLIC_` prefix and are never imported into client components.
- Security headers (CSP, `frame-ancestors`, `Referrer-Policy`) in `next.config.ts` (`security.md`).

## Assets

- `next/image` for raster images with explicit sizes; SVG icons inline or as components.
- Fonts must cover Devanagari (Nepali); self-host or use `next/font` so builds do not depend on network access at runtime.
