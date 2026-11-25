import { createApiClient } from "@keoshaa/api-client";

import { apiBaseUrl } from "./env";
import { fetchWithSession, getAccessToken } from "./session";

/**
 * The browser's API client. The refresh token stays in the backend's `HttpOnly` cookie
 * (`X-Auth-Mode: cookie`); the access token lives only in memory (backend ADR 0013).
 */
export const api = createApiClient({
  baseUrl: apiBaseUrl,
  getAccessToken,
  headers: { "X-Auth-Mode": "cookie" },
  fetch: fetchWithSession,
});
