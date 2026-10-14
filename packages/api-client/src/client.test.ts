import { ApiError, NetworkError } from "@keoshaa/core";
import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";

function envelope(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("createApiClient", () => {
  it("sends the access token", async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(request.headers.get("Authorization")).toBe("Bearer abc");
      return envelope(200, { success: true, data: { status: "ok" }, meta: {} });
    });
    const client = createApiClient({ baseUrl: "http://api", getAccessToken: () => "abc", fetch });
    const { data } = await client.GET("/health");
    expect(data).toBeDefined();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("turns an error envelope into ApiError with the retry time", async () => {
    const fetch = vi.fn(async () =>
      envelope(
        429,
        { success: false, error: { code: "TOO_MANY_CODES", message: "Too many codes" } },
        { "Retry-After": "120", "X-Request-ID": "req-1" },
      ),
    );
    const client = createApiClient({ baseUrl: "http://api", getAccessToken: () => null, fetch });
    const error = await client.GET("/health").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 429,
      code: "TOO_MANY_CODES",
      retryAfterSeconds: 120,
      requestId: "req-1",
    });
  });

  it("reports 401 to the app", async () => {
    const onUnauthorized = vi.fn();
    const fetch = vi.fn(async () =>
      envelope(401, { success: false, error: { code: "SESSION_ENDED", message: "Signed out" } }),
    );
    const client = createApiClient({
      baseUrl: "http://api",
      getAccessToken: () => "old",
      onUnauthorized,
      fetch,
    });
    await expect(client.GET("/health")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledWith(expect.objectContaining({ code: "SESSION_ENDED" }));
  });

  it("turns a failed connection into NetworkError", async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const client = createApiClient({ baseUrl: "http://api", getAccessToken: () => null, fetch });
    await expect(client.GET("/health")).rejects.toBeInstanceOf(NetworkError);
  });
});
