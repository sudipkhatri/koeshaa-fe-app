import type { DeviceIdentity, TokenStore } from "@keoshaa/core";

import { createSessionCore } from "@/features/session/core";

import { API } from "./server";
import type { TokensRead } from "@/features/session/core";

export { API };

/** Token store that keeps everything in memory, for tests. */
export function memoryTokenStore(refreshToken: string | null = null) {
  let access: string | null = null;
  let refresh = refreshToken;
  const store: TokenStore = {
    getAccessToken: () => access,
    async setTokens(tokens) {
      access = tokens.accessToken;
      if (tokens.refreshToken) refresh = tokens.refreshToken;
    },
    getRefreshToken: async () => refresh,
    async clear() {
      access = null;
      refresh = null;
    },
  };
  return store;
}

const device: DeviceIdentity = { getDeviceId: async () => "device-1" };

export function testCore(store: TokenStore = memoryTokenStore()) {
  return createSessionCore({ baseUrl: API, store, device });
}

export function tokensBody(access: string, refresh: string, name = "Aarav") {
  const tokens: TokensRead = {
    access_token: access,
    refresh_token: refresh,
    token_type: "bearer",
    expires_in: 900,
    session_id: "s1",
    user: {
      id: "u1",
      account_kind: "member",
      status: "active",
      name,
      date_of_birth: "2012-01-01",
      dob_source: null,
      source: "self",
      locale: "en",
      mfa_required: false,
      under_13: false,
      identifiers: [],
      created_at: "2026-01-01T00:00:00Z",
      purge_after: null,
    },
  };
  return { success: true, data: tokens, meta: {} };
}

export const errorBody = (code: string) => ({
  success: false,
  error: { code, message: code, details: null },
  meta: {},
});
