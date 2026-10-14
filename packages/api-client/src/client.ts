/**
 * Typed client for the Keoshaa backend, generated from its OpenAPI schema (`src/schema.ts`;
 * never edit by hand: `npm run api:fetch && npm run api:generate`). Adds the access token,
 * turns error envelopes into `ApiError` and connection failures into `NetworkError`, so screens
 * handle one error type.
 */

import { ApiError, NetworkError, type ApiErrorBody } from "@keoshaa/core";
import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "./schema";

export interface ApiClientOptions {
  readonly baseUrl: string;
  /** The current access token, or null when signed out. */
  readonly getAccessToken: () => string | null;
  /** Called on 401 so the app can refresh or sign out; the original error is still thrown. */
  readonly onUnauthorized?: (error: ApiError) => void;
  readonly fetch?: (request: Request) => Promise<Response>;
  /** Extra headers on every request (e.g. `X-Auth-Mode: cookie` on the web). */
  readonly headers?: Readonly<Record<string, string>>;
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(options: ApiClientOptions) {
  const baseFetch = options.fetch ?? ((request: Request) => globalThis.fetch(request));
  const client = createClient<paths>({
    baseUrl: options.baseUrl,
    ...(options.headers ? { headers: options.headers } : {}),
    fetch: async (request: Request) => {
      try {
        return await baseFetch(request);
      } catch (cause) {
        throw new NetworkError(cause);
      }
    },
  });
  client.use(authAndErrors(options));
  return client;
}

function authAndErrors(options: ApiClientOptions): Middleware {
  return {
    onRequest({ request }) {
      const token = options.getAccessToken();
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    },
    async onResponse({ response }) {
      if (response.ok) return response;
      const error = await toApiError(response);
      if (response.status === 401) options.onUnauthorized?.(error);
      throw error;
    },
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get("X-Request-ID") ?? undefined;
  const retryAfter = Number(response.headers.get("Retry-After"));
  const extra = {
    requestId,
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  };
  try {
    const body = (await response.clone().json()) as { error?: ApiErrorBody };
    if (body.error?.code) return new ApiError(response.status, body.error, extra);
  } catch {
    // Not JSON (proxy error page): fall through to a generic error.
  }
  return new ApiError(
    response.status,
    { code: `HTTP_${response.status}`, message: response.statusText || "Request failed" },
    extra,
  );
}
