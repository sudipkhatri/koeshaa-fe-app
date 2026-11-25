import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { getAccessToken, refreshAccessToken, setAccessToken } from "./session";

describe("cookie refresh", () => {
  it("stores only the access token and shares one refresh", async () => {
    setAccessToken(null);
    let calls = 0;
    server.use(
      http.post(`${API}/api/v1/auth/refresh`, () => {
        calls += 1;
        return HttpResponse.json({
          success: true,
          data: { access_token: "access-1", refresh_token: "ignored", expires_in: 900 },
        });
      }),
    );

    const [first, second] = await Promise.all([refreshAccessToken(), refreshAccessToken()]);

    expect(calls).toBe(1);
    expect(first).toBe("signedIn");
    expect(second).toBe("signedIn");
    expect(getAccessToken()).toBe("access-1");
  });

  it("signs out when the cookie session has ended", async () => {
    setAccessToken("stale");
    server.use(
      http.post(`${API}/api/v1/auth/refresh`, () =>
        HttpResponse.json({ error: { code: "SESSION_ENDED", message: "ended" } }, { status: 401 }),
      ),
    );

    expect(await refreshAccessToken()).toBe("signedOut");
    expect(getAccessToken()).toBeNull();
  });

  it("stays offline without clearing a token when the network fails", async () => {
    setAccessToken("kept");
    server.use(http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.error()));

    expect(await refreshAccessToken()).toBe("offline");
    expect(getAccessToken()).toBe("kept");
  });
});
