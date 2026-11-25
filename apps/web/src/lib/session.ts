import type { components } from "@keoshaa/api-client";

import { apiBaseUrl } from "./env";

type TokensRead = components["schemas"]["TokensRead"];

/** Result of asking the cookie session for a new access token. */
export type RestoreResult = "signedIn" | "signedOut" | "offline" | "failed";

/** The access token in memory only: never in localStorage or a readable cookie. */
let accessToken: string | null = null;
let refreshInFlight: Promise<RestoreResult> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * One refresh at a time. The refresh token rotates in the HttpOnly cookie, so two
 * overlapping refreshes would end the session.
 */
export function refreshAccessToken(): Promise<RestoreResult> {
  refreshInFlight ??= runRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function runRefresh(): Promise<RestoreResult> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-Auth-Mode": "cookie" },
      body: "{}",
    });
    if (response.ok) {
      // Envelope from the generated TokensRead. Only the access token is kept in memory.
      const body = (await response.json()) as { data?: TokensRead };
      const token = body.data?.access_token;
      if (!token) return "failed";
      setAccessToken(token);
      return "signedIn";
    }
    if (response.status === 401) {
      setAccessToken(null);
      return "signedOut";
    }
    return "failed";
  } catch {
    return "offline";
  }
}

/** Retries one expired access token. Auth routes and signed-out calls are left alone. */
export async function fetchWithSession(request: Request): Promise<Response> {
  const retryRequest = request.clone();
  const response = await fetch(request, { credentials: "include" });
  const path = new URL(request.url).pathname;
  if (
    response.status !== 401 ||
    path.startsWith("/api/v1/auth/") ||
    !request.headers.has("Authorization")
  ) {
    return response;
  }
  const restored = await refreshAccessToken();
  if (restored !== "signedIn") return response;
  const token = getAccessToken();
  if (token) retryRequest.headers.set("Authorization", `Bearer ${token}`);
  return fetch(retryRequest, { credentials: "include" });
}
