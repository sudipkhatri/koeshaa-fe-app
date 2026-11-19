import type { DeviceIdentity, TokenStore } from "@keoshaa/core";
import { createApiClient } from "@keoshaa/api-client";
import type { components } from "@keoshaa/api-client";

export type TokensRead = components["schemas"]["TokensRead"];

/** The three `401` codes that really end a session (backend sign-in guide); anything else keeps it. */
const SESSION_END_CODES = new Set(["TOKEN_INVALID", "SESSION_ENDED", "SIGNED_OUT_FOR_DEVICE"]);

export type RefreshOutcome = "ok" | "ended" | "failed";

export interface SessionCoreOptions {
  baseUrl: string;
  store: TokenStore;
  device: DeviceIdentity;
  fetch?: (request: Request) => Promise<Response>;
}

/**
 * Owns the tokens: attaches the access token, refreshes it once when it expires (one refresh at
 * a time for every parallel request, because rotating refresh tokens end the session if used
 * twice) and tells the app when the session is over.
 */
export function createSessionCore(options: SessionCoreOptions) {
  const baseFetch = options.fetch ?? ((request: Request) => globalThis.fetch(request));
  const endListeners = new Set<(code: string) => void>();
  let inFlight: Promise<RefreshOutcome> | null = null;

  async function accept(tokens: TokensRead): Promise<void> {
    await options.store.setTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresInSeconds: tokens.expires_in,
    });
  }

  async function clear(): Promise<void> {
    await options.store.clear();
  }

  async function end(code: string): Promise<void> {
    await clear();
    endListeners.forEach((listener) => listener(code));
  }

  async function runRefresh(): Promise<{ outcome: RefreshOutcome }> {
    const refreshToken = await options.store.getRefreshToken();
    if (!refreshToken) return { outcome: "ended" };
    try {
      const response = await baseFetch(
        new Request(`${options.baseUrl}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }),
      );
      if (response.ok) {
        const body = (await response.json()) as { data: TokensRead };
        await accept(body.data);
        return { outcome: "ok" };
      }
      const code = await errorCode(response);
      if (response.status === 401 && SESSION_END_CODES.has(code)) {
        await end(code);
        return { outcome: "ended" };
      }
      return { outcome: "failed" };
    } catch {
      // No connection: keep the stored token, the user may still be signed in.
      return { outcome: "failed" };
    }
  }

  function refresh(): Promise<RefreshOutcome> {
    inFlight ??= runRefresh()
      .then((result) => result.outcome)
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  }

  async function sessionFetch(request: Request): Promise<Response> {
    const retry = request.clone();
    const response = await baseFetch(request);
    const isAuthRoute = new URL(request.url).pathname.startsWith("/api/v1/auth/");
    const hadToken = request.headers.has("Authorization");
    if (response.status !== 401 || isAuthRoute || !hadToken) return response;
    const outcome = await refresh();
    if (outcome !== "ok") return response;
    retry.headers.set("Authorization", `Bearer ${options.store.getAccessToken() ?? ""}`);
    return baseFetch(retry);
  }

  const api = createApiClient({
    baseUrl: options.baseUrl,
    getAccessToken: () => options.store.getAccessToken(),
    fetch: sessionFetch,
  });

  return {
    api,
    accept,
    clear,
    refresh,
    getDeviceId: () => options.device.getDeviceId(),
    hasRefreshToken: async () => (await options.store.getRefreshToken()) !== null,
    onEnded(listener: (code: string) => void): () => void {
      endListeners.add(listener);
      return () => endListeners.delete(listener);
    },
  };
}

export type SessionCore = ReturnType<typeof createSessionCore>;

async function errorCode(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { code?: string } };
    return body.error?.code ?? "";
  } catch {
    return "";
  }
}
