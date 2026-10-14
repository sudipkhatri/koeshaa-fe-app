/**
 * Browser-visible settings. `NEXT_PUBLIC_*` values are inlined at build time (Next.js
 * environment-variables guide), so they are never secrets.
 */
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
