import { createApiClient } from "@keoshaa/api-client";

import { apiBaseUrl } from "./env";
import { accessToken } from "./session";

/**
 * The browser's API client. The refresh token stays in the backend's `HttpOnly` cookie
 * (`X-Auth-Mode: cookie`); the access token lives only in memory (backend ADR 0013).
 */
export const api = createApiClient({
  baseUrl: apiBaseUrl,
  getAccessToken: accessToken,
  headers: { "X-Auth-Mode": "cookie" },
  fetch: (request) => fetch(request, { credentials: "include" }),
});
