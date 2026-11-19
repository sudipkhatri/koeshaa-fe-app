import { http, HttpResponse } from "msw";

import { API, errorBody, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { server } from "@/test/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function expireAccessTokens(onRefresh: () => void, refreshResponse?: () => Response) {
  server.use(
    http.get(`${API}/api/v1/me/devices`, ({ request }) =>
      request.headers.get("Authorization") === "Bearer fresh"
        ? HttpResponse.json({ success: true, data: [], meta: {} })
        : HttpResponse.json(errorBody("UNAUTHORIZED"), { status: 401 }),
    ),
    http.post(`${API}/api/v1/auth/refresh`, () => {
      onRefresh();
      return refreshResponse?.() ?? HttpResponse.json(tokensBody("fresh", "refresh-2"));
    }),
  );
}

describe("session refresh", () => {
  it("refreshes once for many parallel requests, then retries them all", async () => {
    const store = memoryTokenStore("refresh-1");
    await store.setTokens({ accessToken: "stale", expiresInSeconds: 1 });
    const core = testCore(store);
    const onRefresh = jest.fn();
    expireAccessTokens(onRefresh);

    const results = await Promise.all([
      core.api.GET("/api/v1/me/devices"),
      core.api.GET("/api/v1/me/devices"),
      core.api.GET("/api/v1/me/devices"),
    ]);

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r.response.ok)).toBe(true);
    expect(await store.getRefreshToken()).toBe("refresh-2");
  });

  it("signs out when the refresh token is no longer valid", async () => {
    const store = memoryTokenStore("refresh-1");
    await store.setTokens({ accessToken: "stale", expiresInSeconds: 1 });
    const core = testCore(store);
    const ended = jest.fn();
    core.onEnded(ended);
    expireAccessTokens(
      () => undefined,
      () => HttpResponse.json(errorBody("SIGNED_OUT_FOR_DEVICE"), { status: 401 }),
    );

    await expect(core.api.GET("/api/v1/me/devices")).rejects.toMatchObject({ status: 401 });

    expect(ended).toHaveBeenCalledWith("SIGNED_OUT_FOR_DEVICE");
    expect(await store.getRefreshToken()).toBeNull();
  });

  it("keeps the stored token when there is no connection during refresh", async () => {
    const store = memoryTokenStore("refresh-1");
    const core = testCore(store);
    const ended = jest.fn();
    core.onEnded(ended);
    server.use(http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.error()));

    expect(await core.refresh()).toBe("failed");

    expect(ended).not.toHaveBeenCalled();
    expect(await store.getRefreshToken()).toBe("refresh-1");
  });

  it("does not try to refresh a failed sign-in", async () => {
    const core = testCore();
    const onRefresh = jest.fn();
    server.use(
      http.post(`${API}/api/v1/auth/sign-in`, () =>
        HttpResponse.json(errorBody("INVALID_CREDENTIALS"), { status: 401 }),
      ),
      http.post(`${API}/api/v1/auth/refresh`, () => {
        onRefresh();
        return HttpResponse.json(tokensBody("x", "y"));
      }),
    );

    await expect(
      core.api.POST("/api/v1/auth/sign-in", {
        body: { identifier: "aarav", password: "wrong-wrong", device_id: "d" },
      }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
